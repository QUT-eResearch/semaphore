/*!
 * Semaphore CLI-wrapper web service - Cluster app that controls the worker node.
 */

var cluster = require('cluster');
var request = require('request');
var fs = require('fs');
var path = require('path');
var logger = require('jsx').Logger(module);
var fsx = require('jsx').fsx;
var conf = require('./conf');

var PORT = 33000;
var HOST = '127.0.0.1';
//var numWorker = require('os').cpus().length;
var numWorker = 1;
var shutdownWorkers = 0;
var shutdownRequested = false;

logger.debug("master pid:"+process.pid);

// Validate that all external executables files and related directories exist
(function validateConfig(done) {
  // Worker must have at least one valid executor, otherwise it is useless to run the worker
  if (!conf.executors || conf.executors.length === 0) {
    logger.fatal('No valid configuration for at least one job type. Terminating..');
    process.exit();
  }
  
  // Check if temp working dir exist and writeable, or can be created if not exist.
  if (fs.existsSync(conf.tempWorkingDir)) {
    var testfile = path.join(conf.tempWorkingDir, 'test');
    try {
      fs.mkdirSync(testfile);
      fs.rmdirSync(testfile);
    } catch (ex) {
      logger.fatal('No write access to the tempWorkingDir. Terminating..');
      process.exit();
    }
  } else {
    try { 
      fs.mkdirSync(conf.tempWorkingDir);
    } catch (ex) {
      logger.fatal('Cannot create tempWorkingDir. Terminating..');
      process.exit();
    }
  }
  
  // Check for any unfinished jobs that will never be processed, require manual intervention.
  // i.e., the number of sub dir in the temp working dir is more than the number of worker processes (numWorker).
  if (fsx.sync.countDir(conf.tempWorkingDir) > numWorker) {
    logger.fatal('The number of assigned workers is less than the previous unfinished jobs. Terminating..');
    process.exit();
  }
  
  // Check manager server status (API server is running)
  (function validateManager() {
    request(conf.manager.url.base, function (error, response, body) {
      //logger.debug(response);
      if (!error && response) {
        logger.debug(body);
        if (response.statusCode == 200) {
          return done(); //all is good, continue by starting all workers
        }
      }
      logger.fatal('Cannot access manager server. Terminating..');
      process.exit();
    });
  })();
  
})(startWorkers);

function startWorkers() {
  logger.debug('Starting workers..');
  cluster.setupMaster({
    exec : "worker.js"
    //silent : true
  });

  // Fork workers.
  for (var i = 0; i < numWorker; i++) {
    var worker = cluster.fork();
    worker.send(i);
    worker.uid = i;
  }
  
  // Create a tcp socket server to accept shutdown request
  var net = require('net');
  net.createServer(function(c) {
    logger.info('SHUTDOWN request from: ' + c.remoteAddress +':'+ c.remotePort);
    c.on('data', function(data) {
      if (data.toString() == 'shutdown') {
        shutdownRequested = true;
        cluster.disconnect();
      }
    });
  }).listen(PORT, HOST);
  
}

cluster.on('exit', function(worker, code, signal) {
  logger.info('worker ' + worker.uid + ' died.');
  //logger.debug('code: '+code+' signal:'+signal);
  if (shutdownRequested || code === 0) {
    shutdownWorkers++;
  } else {
    // Worker dies for some reasons beside intentional shutdown, restart
    var uid = worker.uid;
    logger.info('worker %d will be restarted in 3 seconds', uid);
    setTimeout(function() {
      var newWorker = cluster.fork();
      newWorker.uid = uid;
      newWorker.send(uid);
    }, 3000);
  }
  
  if (shutdownWorkers == numWorker) process.exit();
});

cluster.on('listening', function(worker, address) {
  logger.info("A worker is now connected to " + address.address + ":" + address.port);
});

