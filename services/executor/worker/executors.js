"use strict";

var logger = require('jsx').createLogger(module);

var executors = {};
executors.ExternalExecutor = require('./executors/ExternalExecutor');
executors.CenturyExecutor = require('./executors/CenturyExecutor');
executors.CopyExecutor = require('./executors/CopyExecutor');

module.exports = function(settings) {
  executors.instances = createInstances(settings);
  executors.instances.copy = new executors.CopyExecutor();
  return executors;
};

// Create external executors and validate executables for each type
function createInstances(settings) {
  var instances = {};
  Object.keys(settings).forEach( function(name) {
    var opt = settings[name];
    if (!opt.executor) return;
    var ex = new executors[opt.executor](opt);
    if (ex.isValid()) {
      logger.debug('Job executor handling "%s" configuration OK', name);
      instances[name] = ex;
    } else {
      logger.error('Job executor handling "%s" configuration is invalid and will be ignored', name);
    }
  });
  //executors.kepler = new ex.KeplerExecutor('kepler');
  return instances;
}

