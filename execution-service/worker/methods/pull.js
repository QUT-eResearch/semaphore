var request = require('request');
var conf = require('../conf');
var Class = require('jsx').Class;

var logger = require('jsx').Logger(module);
logger.debug('pull method');

module.exports = Class('PullMethod', {
  _init : function() {
    this.processJob = undefined;
    this.isDone = true;
    this.keepAlive = true;
  },
  connect : function() {
    logger.debug('pull.connect');
  },
  disconnect : function() {
    logger.debug('pull.disconnect');
    this.keepAlive = false;
  },
  accept : function(callback) {
    /// Use to signal that the worker is ready to accept new job from the manager
    logger.debug('pull.accept');
    if (!this.isDone) throw new Error('Cannot accept new job, the current one has not been done.');
    this.processJob = callback;
    this.isDone = false;
    var self = this;
    process.nextTick(function(){
      getJob(self);
    });
  },
  confirm : function(jobId, callback) {
    var url = conf.manager.url.process + '?confirm='+jobId;
    request.get(url, createResponseHandler(callback));
  },
  done : function(job, callback) {
    var self = this;
    var url = conf.manager.url.end+'/'+job.id;
    //var body = JSON.stringify(job);
    logger.debug(job);
    request.put({url:url, body:job, json:true}, createResponseHandler(function(){self.isDone = true; callback();}));
  }

});

function getJob(method) {
  request.get({url:conf.manager.url.process, json:true}, function(err, res, body){
    logger.debug(body);
    if (!err && (typeof body === 'object')) {
      var job = body;
      //TODO: ensure job object is valid
      if (job.id) {
        method.processJob(job);
        return;
      } else {
        logger.debug('No job available. Try again in 5s.');
      }
    } else {
      logger.error('Cannot fetch job. Try again in 5s.');
    }
    if (method.keepAlive) setTimeout(function(){getJob(method);}, 5000);
  })
}

function createResponseHandler(successCallback) {
  if (typeof successCallback !== 'function') throw new Error('createResponseHandler(successCallback): successCallback  must be a function.');
  return function(err, res, body){
    if (!err && res.statusCode == 200) {
      if (arguments.length === 0) {
        successCallback.call(undefined);
      } else {
        var args = Array.prototype.slice.call(arguments, 1);
        successCallback.apply(undefined, args);
      }
    } else {
      logger.error('Url %s is inaccessible.', res.request.href);
    }
  };
}
