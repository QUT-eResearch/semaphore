var exec = require('child_process').exec;
var fsx = require('jsx').fsx;
var conf = require('./conf');
var path = require('path');

process.stdout.write('This will clean up all the data. Proceed? (y/n)');
var stdin = process.openStdin();
stdin.once('data', function(chunk) {
  if (chunk.toString().trim() == 'y') {
    var c = 0;
    exec('redis-cli flushdb', {}, function(err,sout,serr){
      fsx.async.remove(path.join(conf.pathTempUpload,'*'), onFinish);
      fsx.async.remove(path.join(conf.pathJobData,'*'), onFinish);
    });
    function onFinish() {
      c++;
      if (c == 2) {
        console.log("cleaning up data.. ok.");
        process.exit();
      }
    }
  } else {
    process.exit();
  }
});