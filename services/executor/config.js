"use strict";

var path = require('path');
var logLevel = 'debug'; //debug,info,warn,error,fatal
var logger = require('jsx').createLogger(module).setLevel(logLevel);

var config = module.exports = {};

config.appName = 'Semaphore Executor Service';
config.appVersion = '0.0.1';

var env = process.env;
if (!env.OS_USERNAME || !env.OS_PASSWORD || !env.OS_TENANT_NAME || !env.OS_TENANT_NAME || !env.OS_TENANT_ID) {
  logger.fatal('The environment must be set for: OS_USERNAME, OS_PASSWORD, OS_TENANT_ID, OS_TENANT_NAME, OS_AUTH_URL');
  process.exit(1);
}
var storage = config.storage = {};
storage.container = 'Semaphore.Jobs';
storage.inputPrefix = 'input';
storage.outputPrefix = 'output';
storage.uploadRepeatInterval = 2000;
var auth = storage.auth = {};
auth.username = env.OS_USERNAME || '';
auth.password = env.OS_PASSWORD || '';
auth.tenantId = env.OS_TENANT_ID || '';
auth.tenantName = env.OS_TENANT_NAME || '';
auth.url = env.OS_AUTH_URL || '';
auth.serviceName = 'Object Storage Service';
auth.region = 'Qld';

//config.pathBaseData = '/data';
config.host = process.env.SEMAPHORE_EXECUTOR_HOST || 'localhost';
config.port = process.env.SEMAPHORE_EXECUTOR_PORT || '3002';

config.pathBaseData = '/home/nodejs/data';
config.pathTempUpload = path.join(config.pathBaseData, 'upload');
config.pathJobData = path.join(config.pathBaseData, 'jobs');
config.pathBaseExtCmd = '/home/nodejs/models'; //used by worker
config.dirBin = 'bin'; //used by worker
config.dirDefaultInput = 'default_input'; //used by worker

//config.urlManager = 'http://semaphore.n2o.net.au/ws/executor';
config.urlManager = 'http://' + config.host + ':' + config.port;
config.urlJobData = 'http://' + config.host + ':' + config.port + '/jobdata';

config.getPathToJobDataFile = function(jobId, fileName) {
  return path.join(config.pathJobData, jobId, fileName);
};
config.getUrlToJobDataFile = function(jobId, fileName) {
  return config.urlJobData + '/' + jobId + '/' + fileName;
};

config.jobTypes = {
  century: 'century',
  daycent: 'daycent',
  kepler: 'kepler'
};

config.str = {};
config.str.paramJsonInput = 'JsonInput';
config.str.paramJsonInputFiles = 'JsonInputFiles';
config.str.paramInputFiles = 'InputFiles';

/**
 * This app assumes that all external programs are configures as follows:
 * executable path is baseDir + models[?] + binDir
 * prepScript and runScript is relative to the executable path
 * defaultInputDir is relative to the baseDir + models[?]
 * Use double backslash to separate paths in Windows `\\`
 */

var worker = config.worker = {};
var numCpu = require('os').cpus().length;
worker.processes = process.env.SEMAPHORE_EXECUTOR_WORKER_NUM || numCpu;

worker.pathTemp = '/home/nodejs/data/workers'; //used by worker
worker.pathApi = '/api/v0.2/worker';
worker.downloadBaseUrl = config.urlJobData;

worker.manager = {};
worker.manager.host = config.host;
worker.manager.url = {};
var managerUrlBase = worker.manager.url.base = config.urlManager + worker.pathApi;
worker.manager.url.connect = managerUrlBase + '/connect'; //connect a worker with the manager
worker.manager.url.disconnect = managerUrlBase + '/disconnect'; //disconnect a worker with the manager
worker.manager.url.process = managerUrlBase + '/process'; //workers pull the job from manager
worker.manager.url.update = managerUrlBase + '/update'; //progress update and heartbeat, pull method must periodically report for heartbeat
worker.manager.url.end = managerUrlBase + '/end'; //notify manager if the job processing is finished
worker.manager.url.upload = managerUrlBase + '/upload';
worker.manager.timeout = process.env.SEMAPHORE_EXECUTOR_WORKER_TIMEOUT || 0; 

/** 
 * Supported methods: 
 *   'push' - A job is pushed from the manager server. Worker must register to the manager first and provide a public web API
 *   'pull' - A worker pulls a job from the manager server and is responsible to periodically checking for a new job
 *   'poll' - A push strategy implemented using http long polling
 *   'redis' - Connect directly to the redis port on the manager server
 */
worker.protocol = 'redis';
worker.protocols = {};
worker.protocols.redis = { manager: worker.manager, host: config.host, port: 6379, redis:{max_attempts:7} };
worker.protocols.pull = { manager: worker.manager, repeatInterval: 2000 };
worker.protocols.push = { manager: worker.manager, pathBase: '/api/jobs/' };
worker.protocols.poll = { manager: worker.manager, pathBase: '/api/jobs/' };

var executors = worker.executors = {};

var centCommon = {
  pathBase: config.pathBaseExtCmd,
  dirBin: config.dirBin,
  dirDefaultInput: config.dirDefaultInput,
  outvars: 'outvars.txt'
};

executors.century = Object.create(centCommon);
executors.century.executor = 'CenturyExecutor';
executors.century.name = 'century';
executors.century.list100 = executors.century.name + '_list100';

executors.daycent = Object.create(centCommon);
executors.daycent.executor = 'CenturyExecutor';
executors.daycent.name = 'daycent';
executors.daycent.list100 = executors.daycent.name + '_list100';

executors.kepler = {};

// Configuration for adaptive cloud provisioning
config.cloud = {};
config.cloud.enableAutoScaling = false;
config.cloud.maxInstances = 5;
