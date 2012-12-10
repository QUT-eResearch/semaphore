/**
 * This app assumes that all external programs are configures as follows:
 * executable path is baseDir + models[?] + binDir
 * prepScript and runScript is relative to the executable path
 * defaultInputDir is relative to the baseDir + models[?]
 * Use double backslash to separate paths in Windows `\\`
 */

var logLevel = 'debug'; //debug,info,warn,error,fatal
 
var centOptions = {
  basePath: 'C:\\dev\\models',
  binDir: 'bin',
  defaultInputDir: 'param',
  list100: 'list100'
};

var tempWorkingDir = 'C:\\temp\\worker';
//var managerUrlHost = 'http://115.146.95.104';
var managerUrlHost = 'http://localhost:3000';
var managerUrlBase = managerUrlHost + '/api/1/worker/';
var models = ['daycent', 'century'];

///////////////////////////////////// Preprocess configs
var path = require('path');
var logger = require('jsx').Logger(module).setLevel(logLevel);
var ex = require('./executors.js');

// Create external executors and validate executables for each type
function createExecutors() {
  var executors = {};
  models.forEach( function(name) {
    var cex = new ex.CenturyExecutor(name, centOptions);
    if (cex.isValid()) {
      logger.debug('Job executor handling "%s" configuration OK', name);
      executors[name] = cex;
    } else {
      logger.error('Job executor handling "%s" configuration is invalid and will be ignored', name);
    }
  });
  //executors.kepler = new ex.KeplerExecutor('kepler');
  return executors;
}

var conf = {
  /** 
   * Supported methods: 
   *   'push' - A job is pushed from the manager server. Worker must register to the manager first and provide a public web API
   *   'pull' - A worker pulls a job from the manager server and is responsible to periodically checking for a new job
   *   'poll' - A push strategy implemented using http long polling
   */
  transportMethod: "pull",
  repeatInterval: 2000,
  tempWorkingDir: tempWorkingDir,
  executors: createExecutors(),
  copyExecutor: new ex.CopyExecutor(),
  manager: { 
    url: {
      host: managerUrlHost
    , base: managerUrlBase
    , connect: managerUrlBase + "connect" // for websocket
    , register: managerUrlBase + "register" //used for pushing the jobs to the workers
    , process: managerUrlBase + "process" //Workers pull the job from manager
    , update: managerUrlBase + "update" //progress update and heartbeat, pull method must periodically report for heartbeat
    , end: managerUrlBase + "end" //notify manager if the job processing is finished
    , upload: managerUrlBase + "upload"
    }
  },
  worker: {
    url: {
      base: "http://115.146.95.104/api/worker/"
    }
  },
  downloadBaseUrl : managerUrlHost + "/files"
};
exports = module.exports = conf;
