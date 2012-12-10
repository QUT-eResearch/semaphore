var fs = require('fs-extra');
var path = require('path');

// helper functions
function File(filename, fullpath) {
  this.name = filename;
  this.path = fullpath;
}

/**
 * Create a new directory and ensure any existing is deleted
 */
function newDir(p, callback) {
  callback = callback || function () {};

  fs.exists(p, function(isExist) {
    if (isExist) {
      fs.remove(p, function() {
        fs.mkdir(p, callback);
      });
    } else {
      fs.mkdir(p, callback);
    }
  });
}

function newDirSync(p) {
  if (fs.existsSync(p)) fs.removeSync(p);
  fs.mkdirSync(p);
}

/**
 * Loop a directory and process each entry of any type
 */
function forEachEntryInDir(p, fn, callback) {
  callback = callback || function () {};

  fs.readdir(p, function(err, files) {
    if (err || !files) return callback(err);
    var index = 0, len = files.length;
    if (len === 0) { 
      return callback();
    }  
    (function iterate() {
      var fname = files[index];
      var file = new File(fname, path.join(p,fname));
      var done = function(err) {
        if (err) return callback(err);
        ++index;
        if (index === len) return callback();
        else process.nextTick(iterate);
      }
      if (fn.length < 2) {
        fn(file);
        done();
      } else {
        fn(file, done);
      }
    })();
  });
}

function forEachEntryInDirSync(p, fn) {
  var files = fs.readdirSync(p);
  files.forEach( function(fname) {
    var file = new File(fname, path.join(p, fname));
    fn(file);
  });
}

function forEachEntryInDirFiltered(p, allows, fn, callback) {
  forEachEntryInDir(p, function(file, done) {
    fs.stat(file.path, function(err, stat) {
      if (!err && stat) {
        file.stat = stat;
        if (allows(file)) {
          if (fn.length < 2) {
            fn(file);
            done();
          } else {
            fn(file, done);
          }
          return;
        }
      }
      done();
    });
  }, callback);
}

/**
 * Loop a directory and process each file
 */
function forEachFileInDir(p, fn, callback) {
  forEachEntryInDirFiltered(p, function(file) { return file.stat.isFile(); }, fn, callback);
}

function forEachFileInDirSync(p, fn) {
  forEachEntryInDirSync(p, function(file) {
    var stat = fs.statSync(file.path);
    if (stat && stat.isFile()) {
      fn(file);
    }
  });
}

/**
 * Loop a directory and process each sub dir
 */
function forEachDirInDir(p, fn, callback) {
  forEachEntryInDirFiltered(p, function(file) { return file.stat.isDirectory(); }, fn, callback);
}

function forEachDirInDirSync(p, fn) {
  forEachEntryInDir(p, function(file) {
    var stat = fs.statSync(file.path);
    if (stat && stat.isDirectory()) {
      fn(file);
    }
  });
}

/**
 * Counts the number of sub directories in a directory
 * callback(count)
 */
function countDir(p, callback) {
  var count = 0;
  forEachDirInDir(p, function(file) { count++; }, function() {callback(count);});
}

function countDirSync(p) {
  var count = 0;
  forEachDirInDirSync(p, function() { count++; });
  return count;
}

//  fs.stat(sourcePath, function(err, stat) {
//    if (!isExist) callback(new Error('copyFile: source does not exist or not a file: ' + sourcePath));
//  });

/**
 * Copy one file only, will overwrite any existing file.
 * callback(err)
 */
function copyFile(sourcePath, destinationPath, callback) {
  fs.stat(sourcePath, function(serr, sstat) {
    if (serr || sstat.isDirectory()) { 
      callback(new Error('copyFile: source file does not exist or is a directory: ' + sourcePath));
    } else {
      fs.stat(path.dirname(destinationPath), function(derr, dstat) {
        if (derr || !dstat.isDirectory()) callback(new Error('copyFile: invalid destination file: ' + destinationPath));
        else copyFileUnchecked(sourcePath, destinationPath, callback);
      });
    }
  });
}

function copyFileUnchecked(sourcePath, destinationPath, callback) {
  try {
    var rs = fs.createReadStream(sourcePath);
    rs.on('error', callback);
    var ws = fs.createWriteStream(destinationPath);
    ws.on('error', callback);
    ws.once('close', callback);
    rs.pipe(ws);
  } catch(e) {
    callback(e);
  }
}

// Buffered file copy, synchronous
// (Using readFileSync() + writeFileSync() could easily cause a memory overflow
//  with large files)
function copyFileSync(srcFile, destFile) {
  if (!fs.existsSync(srcFile)) throw new Error('copyFileSync: no such file or directory: ' + srcFile);

  var BUF_LENGTH = 64*1024,
      buf = new Buffer(BUF_LENGTH),
      bytesRead = BUF_LENGTH,
      pos = 0,
      fdr = null,
      fdw = null;

  try {
    fdr = fs.openSync(srcFile, 'r');
  } catch(e) {
    throw new Error('copyFileSync: could not read src file ('+srcFile+')');
  }

  try {
    fdw = fs.openSync(destFile, 'w');
  } catch(e) {
    throw new Error('copyFileSync: could not write to dest file (code='+e.code+'):'+destFile);
  }

  while (bytesRead === BUF_LENGTH) {
    bytesRead = fs.readSync(fdr, buf, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, buf, 0, bytesRead);
    pos += bytesRead;
  }

  fs.closeSync(fdr);
  fs.closeSync(fdw);
}

/**
 * Copy all files in a directory (non-recursive, no overwrite).
 * @param source, destination must be a directory.
 */
function copyAllFiles(sourceDir, destinationDir, callback) {
  
  function process(file) {
    var destPath = path.join(destinationDir, file.name);
    fs.exists(destPath, function(isExist) { 
      if (isExist) return; 
      copyFileUnchecked(file.path, destPath);
    });
  }
  
  isDirectory(sourceDir, function() {
    isDirectory(destinationDir, function() {
      forEachFileInDir(sourceDir, process, callback);
    });
  });

}

function copyAllFilesSync(sourceDir, destinationDir) {
  if (isDirectorySync(sourceDir) && isDirectorySync(destinationDir)) {
    forEachFileInDirSync(sourceDir, function(file) {
      var destPath = path.join(destinationDir, file.name);
      if (fs.existsSync(destPath)) return;
      copyFileUnchecked(file.path, destPath);
    });
  }
}

function isDirectory(p, callback) {
  fs.stat(p, function(err, stat) {
    if (!err && stat && stat.isDirectory()) callback();
  });
}

function isDirectorySync(p) {
  var stat = fs.statSync(p);
  return (stat && stat.isDirectory());
}

exports.copyAllFiles = copyAllFiles;
exports.copyAllFilesSync = copyAllFilesSync;
exports.copyFile = copyFile;
exports.copyFileSync = copyFileSync;
exports.newDir = newDir;
exports.newDirSync = newDirSync;
exports.countDir = countDir;
exports.countDirSync = countDirSync;
exports.forEachEntryInDir = forEachEntryInDir;
exports.forEachEntryInDirSync = forEachEntryInDirSync;
exports.forEachFileInDir = forEachFileInDir;
exports.forEachFileInDirSync = forEachFileInDirSync;
exports.forEachDirInDir = forEachDirInDir;
exports.forEachDirInDirSync = forEachDirInDirSync;