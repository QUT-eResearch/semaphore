var request = require('request');
var logger = require('jsx').createLogger(module);

exports.validate = function(cb) { 
  cb(true);
};

exports.connect = function(cb) {
  console.log(this.manager.url.connect);
  request.post(this.manager.url.connect, function(err, res, body) {
    console.log(res.statusCode);
    console.log(body);
    if (!err && res.statusCode == 204) cb();
    else logger.error('Error connecting to manager.');
  });
};

exports.disconnect = function() {
  request.post(this.manager.url.disconnect, function(err, res, body) {
    if (err) logger.error(err);
    logger.debug(res.statusCode);
  });
};

exports.accept = function(cb) {};

exports.confirm = function(jobId, cb) {
  process.nextTick(cb);
};

exports.done = function(job, cb) {};