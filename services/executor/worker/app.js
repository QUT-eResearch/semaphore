"use strict";
/*!
 * Semaphore CLI-wrapper web service - Cluster app that controls the worker node.
 */

var cluster = require('cluster');
var fs = require('fs');
var path = require('path');
var logger = require('jsx').createLogger(module);
var fsx = require('jsx').fsx;
var conf = require('../config').worker;

var numWorker = conf.processes;
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
  if (fs.existsSync(conf.pathTemp)) {
    var testfile = path.join(conf.pathTemp, 'test');
    try {
      fs.mkdirSync(testfile);
      fs.rmdirSync(testfile);
    } catch (ex) {
      logger.fatal('No write access to config.pathTemp:`%s`. Terminating..', conf.pathTemp);
      process.exit();
    }
  } else {
    try { 
      fs.mkdirSync(conf.pathTemp);
    } catch (ex) {
      logger.fatal('Cannot create config.pathTemp:`%s`. Terminating..', conf.pathTemp);
      process.exit();
    }
  }
  
  // Check for any unfinished jobs that will never be processed, require manual intervention.
  // i.e., the number of sub dir in the temp working dir is more than the number of worker processes (numWorker).
  if (fsx.sync.countDir(conf.pathTemp) > numWorker) {
    logger.fatal('The number of assigned workers is less than the previous unfinished jobs. Terminating..');
    process.exit();
  }
  
  validateManager();
  // Check manager server status (API server is running)
  function validateManager() {
    logger.debug('Try connectiong to manager [%s] using setting:', conf.protocol);
    logger.debug(conf.protocols[conf.protocol]);
    var manager = require('./protocols/'+conf.protocol)(conf.protocols[conf.protocol]);
    manager.validate(function (isValid, reason) {
      if (isValid) {
        logger.debug('manager OK');
        return ensureOpenstackStorage(); //all is good, continue
      } else {
        logger.fatal('Cannot access manager server. Reason: %s. Terminating..', reason);
        process.exit();
      }
    });
  }
  
  // Ensure storage container in the nectar cloud
  function ensureOpenstackStorage() {
    var openstack = require('openstack');
    var storageConfig = require('../config').storage;
    var swift = openstack.createClient(storageConfig.auth);
    var container = storageConfig.container;
    var headers = {'X-Container-Read':'.r:*'};
    swift.createContainer({container:container, headers:headers}, function(err, status){
      if (err) {
        logger.fatal('Cannot access the cloud storage. Reason: %s. Terminating..', err);
      } else {
        if (status == 201 || status == 202) {
          logger.debug('cloud storage OK');
          return done();
        } else {
          logger.fatal('Cannot create container in the cloud storage. Reason: %s. Terminating..', status);
        }
      }
      process.exit();
    });
  }
})(startWorkers);

function startWorkers() {
  logger.debug('Creating %s workers.', numWorker);
  cluster.setupMaster({
    exec : __dirname+"/worker.js"
    //silent : true
  });

  // Fork workers.
  for (var i = 0; i < numWorker; i++) {
    var worker = cluster.fork();
    worker.send(i);
    worker.uid = i;
  }
}

cluster.on('exit', function(worker, code, signal) {
  logger.info('worker %d died: code=%s, signal=%s', worker.uid, code, signal);
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
  
  if (shutdownWorkers == numWorker) {
    logger.info('No worker alive, exiting main app..');
    process.exit();
  }
});

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

function shutdown() {
  shutdownRequested = true;
  logger.info('Shutting down Manager..');
  cluster.disconnect();
}
