var path = require('path');
var fs = require('fs');
var Wildcard = require('./Wildcard');

module.exports = {
  async: {
    forEach: forEach,
    filteredForEach: filteredForEach,
    createDir: createDir,
    removeFile: removeFile,
    removeDir: removeDir,
    remove: remove,
    move: move,
    copy: copy,
    readJson : readJsonFile,
    writeJson : writeJsonFile
  },
  sync: {
    forEach: forEachSync,
    filteredForEach: filteredForEachSync,
    forEachFile: forEachFileSync,
    forEachDir: forEachDirSync,
    countDir: countDirSync,
    createDir: createDirSync,
    removeFile: removeFileSync,
    removeDir: removeDirSync,
    remove: removeSync,
    readJson : readJsonFileSync,
    writeJson : writeJsonFileSync
  }
};

// helper functions
function File(filename, fullpath) {
  this.name = filename;
  this.path = fullpath;
}

function noop() {};
function errorDirExist(param, p) {
  return new Error('Directory ' + param + ' exists: ' + p);
}
function errorFileExist(param, p) {
  return new Error('Non-directory ' + param + ' exists: ' + p);
}
function errorUnknownType(p) {
  return new Error('Entity is neither file or directory: ' + p);
}
function errorNotExist(param, p) {
  return new Error('Specified ' + param + ' does not exists: ' + p);
}
function errorExist(param, p) {
  return new Error('Specified ' + param + ' exists :' + p);
}
function errorInvalidPath(param, p) {
  return new Error('Invalid ' + param + ' path:' + p);
}
function errorSamePath(p) {
  return new Error('Specified source and target must be different:' + p);
}


/**
 * Loop a directory and process each entry of any type
 */
function forEach(p, fn, callback) {
  callback = callback || noop;

  fs.readdir(p, function(err, files) {
    if (err || !files) return callback(err);
    var index = 0, len = files.length;
    if (len === 0) { 
      return callback();
    }  
    (function iterate() {
      var fname = files[index];
      var file = new File(fname, path.join(p,fname));
      function done(err) {
        if (err) return callback(err);
        ++index;
        if (index === len) process.nextTick(callback);
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

/** 
 * @match(@p path-to-file) function that will be evaluated to filter the iteration. Must return true if the supplied path needs to be processed , otherwise false.
 */
function filteredForEach(p, match, fn, callback) {
  callback = callback || noop;
  forEach(p, function (file, done) {
    fs.stat(file.path, function (err, stat) {
      if (err || !stat) {
        done(err);
      } else {
        file.stat = stat;
        if (match(file)) {
          if (fn.length < 2) {
            fn(file);
            done();
          } else {
            fn(file, done);
          }
        } else {
          done();
        }
      }
    });
  }, callback);
}

/**
 * Create a new directory and ensure any existing is deleted
 */
function createDir(p, callback) {
  callback = callback || noop;

  fs.stat(p, function (err, stat) {
    if (err) {
      fs.mkdir(p, callback);
    } else {
      if (stat.isDirectory()) {
        //console.log('start remove');
        removeDir(p, function (err) {
          fs.mkdir(p, function (err) {
            if (err) process.nextTick(function () { createDir(p, callback); });
            else callback();
          });
        });
      } else {
        return callback(errorFileExist('path', p));
      }
    }
  });
}


/**
 * Copy one file only, will overwrite any existing file.
 * callback(err)
 */
function copyFile(sourcePath, destinationPath, callback) {
  fs.stat(sourcePath, function(serr, sstat) {
    if (serr || sstat.isDirectory()) { 
      callback( errorNotExist('sourcePath', sourcePath) ); //or is a directory
    } else {
      fs.stat(path.dirname(destinationPath), function(derr, dstat) {
        if (derr || !dstat.isDirectory()) callback(errorInvalidPath('target', destinationPath));
        else copyFileUnchecked(sourcePath, destinationPath, callback);
      });
    }
  });
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


function containsWildcard(path) {
  return (path.indexOf('*') != -1) || (path.indexOf('?') != -1);
}

function copyFileUnchecked(sourcePath, targetPath, callback) {
  fs.stat(sourcePath, function (err, stat) {
    if (err) return callback(err);

    var rs = fs.createReadStream(sourcePath);
    rs.on('error', callback);
    var ws = fs.createWriteStream(targetPath);
    ws.on('error', callback);
    ws.once('close', function (err) {
      if (err) return callback(err);
      fs.utimes(targetPath, stat.atime, stat.mtime, callback);
    });
    rs.pipe(ws);
  });
}

/** 
 * target must not contain wildcard, target base dir must exist 
 * default options: { ignoreErrors:false, overwrite: false, recursive: true }
 */
function copy(source, target, options, callback) {
  if (!callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      callback = noop;
    }
  }
  options = options || {};
  var opt = {};
  opt.ignoreErrors = typeof options.ignoreErrors !== 'undefined' ? options.ignoreErrors : false;
  opt.overwrite = typeof options.overwrite !== 'undefined' ? options.overwrite : false;
  opt.recursive = typeof options.recursive !== 'undefined' ? options.recursive : true;

  var sourcePath = path.resolve(source);
  var targetPath = path.resolve(target);

  // source and target path must be different
  if (sourcePath === targetPath) return callback(errorSamePath(sourcePath));

  // Check for wildcard
  if (containsWildcard(source)) {
    // Check parent dir
    var sourceBaseDir = path.dirname(sourcePath);
    fs.stat(sourceBaseDir, function (err, stat) {
      if (err || !stat.isDirectory()) { // Parent dir does not exist, error
        return callback(errorNotExist('source base directory', sourceBaseDir));
      } else {
        // Validate target: 
        // - must exist and must be a directory
        fs.stat(targetPath, function (tErr, tStat) {
          if (tErr || !tStat) return callback(errorNotExist('target', targetPath));
          else if  (!tStat.isDirectory()) return callback(errorFileExist('target', targetPath));

          // process wildcard
          var sourceBaseName = path.basename(sourcePath);
          function matchWildcard(file) {
            var wc = Wildcard(sourceBaseName);
            return wc(file.name);
          }
          function copyAny(file, done) {
            var dest = path.join(targetPath, file.name);
            if (file.stat.isDirectory()) {
              if (opt.recursive) copyDir(file.path, dest, done);
              else done();
            } else {
              copyFileUnchecked(file.path, dest, done);
            }
          }
          filteredForEach(sourceBaseDir, matchWildcard, copyAny, callback);

        });
      }
    });
  } else {
    fs.stat(sourcePath, function (err, stat) {
      if (err) { // Source path not found
        return callback(errorNotExist('source', sourcePath));
      } else if (stat) {
        // Validate target:
        // - target or it's parent must exists
        // - must not contain wildcard
        fs.stat(targetPath, function (tErr, tStat) {
          if (tErr || !tStat) {
            // target does not exists, check parent dir
            var targetBaseDir = path.dirname(targetPath);
            fs.stat(targetBaseDir, function (tpErr, tpStat) {
              if (tpErr || !tpStat) return callback(errorNotExist('target base  directory', targetBaseDir));
              else startCopy();
            });
          } else {
            startCopy();
          }

          function startCopy() {
            if (stat.isDirectory()) {
              copyDir(sourcePath, targetPath, callback);
            } else {
              // If target is a directory, copy source file to the directory
              if (tStat && tStat.isDirectory()) targetPath = path.join(targetPath, path.basename(sourcePath));
              copyFileUnchecked(sourcePath, targetPath, callback);
            }
          }

        });
      } else { //unexpected error
        callback(err);
      }
    });
  }

  function copyDir(sourceDir, targetDir, cb) {
    /// sourceDir must be validated before calling this function
    var stack = [];
    var dir = {source:sourceDir, target:targetDir};

    (function iterate() {
      function done(err) {
        if (err && !opt.ignoreErrors) return cb(err);
        if (stack.length > 0) {
          dir = stack.pop();
          process.nextTick(iterate);
        } else {
          return cb();
        }
      }
      // Check target dir existance
      fs.stat(dir.target, function (err, stat) {
        if (err || !stat) { // Target dir does not exist, create it
          fs.mkdir(dir.target, function (err) {
            if (err) return done(err);
            forEach(dir.source, processFile, done);
          });
        } else if (!stat.isDirectory()) { // target exists, not a directory
          // cannot copy a dir/files to an existing file
          done(errorFileExist('target', dir.target));
        } else { // Target dir exists
          forEach(dir.source, processFile, done);
        }
      });

    })();

    function processFile(file, done) {
      /// Process each file in a source directory, copy to target
      var sourcePath = file.path;
      var targetPath = path.join(dir.target, file.name);
      fs.stat(sourcePath, function (err, stat) {
        if (err) {
          if (!opt.ignoreErrors) return done(err); // source not exist 
        } else if (stat) {
          if (stat.isDirectory()) {
            if (opt.recursive) stack.push({ source: sourcePath, target: targetPath });
            return done();
          } else {
            fs.stat(targetPath, function (targetErr, targetStat) {
              if (!targetErr && !options.overwrite) return done(); // target exists, do not overwrite
              if (targetStat && targetStat.isDirectory()) {
                // cannot copy a file to an existing directory
                if (!opt.ignoreErrors) return done(errorDirExist('target', targetPath));
              } else {
                // Copy a file to a file, overwrite if necessary
                copyFileUnchecked(sourcePath, targetPath, function (err) {
                  if (err && !opt.ignoreErrors) done(err);
                  else done();
                });
              }
            });
          }
        }
      });
    }

  } //function copyDir

}

function removeFile(file, callback) {
  callback = callback || noop;
  fs.unlink(file, function (err) {
    if (err) {
      // Try to override file permission
      if (err.code === 'EPERM') {
        fs.chmod(file, '0666', function (err2) {
          if (!err2) fs.unlink(file, callback);
          else return callback(err2);
        });
      } else {
        return callback(err);
      }
    } else {
      return callback();
    }
  });
}

function removeDir(dir, callback) {
  callback = callback || noop;
  forEach(dir, function (file, done) {
    fs.stat(file.path, function (err, stat) {
      if (stat.isDirectory()) {
        removeDir(file.path, done);
      } else {
        removeFile(file.path, done);
      }
    });
  }, function (err) {
    //if (!err) fs.rmdir(dir, callback);
    if (!err) {
      fs.rmdir(dir, function (err) {
        //console.log('rmdir finish: ' + err);
        if (err) process.nextTick(function () { removeDir(dir, callback); });
        else process.nextTick(callback);
      });
    } else {
      return callback(err);
    }
  });
}

function remove(files, callback) {
  callback = callback || noop;
  // Check for wildcard
  if (containsWildcard(files)) {
    // Check parent dir
    var baseDir = path.dirname(files);
    fs.stat(baseDir, function (err, stat) {
      if (err || !stat.isDirectory()) { // Parent dir does not exist, error
        return callback(errorNotExist('base directory', sourceBaseDir));
      } else {
        // process wildcard
        var baseName = path.basename(files);
        function matchWildcard(file) {
          var wc = Wildcard(baseName);
          return wc(file.name);
        }
        function removeAny(file, done) {
          if (file.stat.isDirectory()) {
            removeDir(file.path, done);
          } else if (file.stat.isFile()) {
            removeFile(file.path, done);
          } else {
            return callback(errorUnknownType(files));
          }
        }
        filteredForEach(baseDir, matchWildcard, removeAny, callback);
      }
    });
  } else {
    fs.stat(files, function (err, stat) {
      if (err) return callback(errorNotExist('files', files));
      if (stat.isFile()) {
        removeFile(files, callback);
      } else if (stat.isDirectory()) {
        // Recursively remove a directory
        removeDir(files, callback);
      } else {
        return callback(errorUnknownType(files));
      }
    });
  }
}

function move(source, target, callback) {
  callback = callback || noop;
  fs.stat(target, function (err) {
    if (!err) return callback(errorExist('target', target));
    fs.rename(source, target, copyAndUnlink);
  });
  function copyAndUnlink(err) {
    if (!err) return callback();
    copy(source, target, function (err) {
      if (!err) {
        remove(source, callback);
      } else {
        callback(err);
      }
    });
  }
}

///////////// sync functions

/**
 * @fn(@file)
 */
function forEachSync(p, fn) {
  var files = fs.readdirSync(p);
  files.forEach( function(fname) {
    var file = new File(fname, path.join(p, fname));
    fn(file);
  });
}

function filteredForEachSync(p, match, fn) {
  forEachSync(p, function(file) {
    file.stat = fs.statSync(file.path);
    if (match(file)) fn(file);
  });
}

/**
 * Loop a directory and process each file
 */
function forEachFileSync(p, fn) {
  filteredForEachSync(p, function(file) { 
    return file.stat.isFile(); 
  }, fn);
}

/**
 * Loop a directory and process each sub-dir
 */
function forEachDirSync(p, fn) {
  filteredForEachSync(p, function(file) { 
    return file.stat.isDirectory(); 
  }, fn);
}

function countDirSync(p) {
  var count = 0;
  forEachDirSync(p, function() { count++; });
  return count;
}

function createDirSync(p) {
  try {
    var stat = fs.statSync(p);
    if (stat) {
      if (stat.isDirectory()) removeDirSync(p);
      else throw errorFileExist('path', p);
    }
  } catch (ex) {
    if (ex.errno !== 34) throw ex;
  }
  fs.mkdirSync(p);
}

// Remove a file, try to change permission if necessary
function removeFileSync(file) {
  try {
    fs.unlinkSync(file);
  } catch(e) {
    // Try to override file permission
    if (e.code === 'EPERM') {
      fs.chmodSync(file, '0666');
      fs.unlinkSync(file);
    } else {
      throw e;
    }
  }
}

function removeDirSync(dir) {
  var files = fs.readdirSync(dir);
  files.forEach(function (file) {
    var fp = path.join(dir, file);
    var stat = fs.lstatSync(fp);
    if (stat.isDirectory()) {
      removeDirSync(fp);
    } else {
      removeFileSync(fp);
    }
  });
  return fs.rmdirSync(dir);
}

function removeSync(files) {
  var stat = fs.statSync(files);
  if (!stat) throw errorNotExist('files', files);
  if (stat.isFile()) {
    removeFileSync(files);
  } else if (stat.isDirectory()) {
    // Recursively remove a directory
    removeDirSync(files);
  } else {
    throw errorUnknownType(files);
  }
}

function readJsonFile(file, callback) {
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            try {
                var obj = JSON.parse(data);
                callback(null, obj);
            } catch (err2) {
                callback(err2, null);
            }
        }
    })
}

function readJsonFileSync(file) {
    var data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
}

function writeJsonFile(file, obj, callback) {
    var str = '';
    try {
        str = JSON.stringify(obj, null, module.exports.spaces);
    } catch (err) {
        callback(err, null);
    }
    fs.writeFile(file, str, callback);
}

function writeJsonFileSync(file, obj) {
    var str = JSON.stringify(obj, null, module.exports.spaces);
    return fs.writeFileSync(file, str); //not sure if fs.writeFileSync returns anything, but just in case
}
