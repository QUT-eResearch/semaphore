exports.validate = function(cb) { 
  cb(true);
};

exports.connect = function(cb) {
  process.nextTick(cb);
};

exports.disconnect = function() {};

exports.accept = function(cb) {};

exports.confirm = function(jobId, cb) {
  process.nextTick(cb);
};

exports.done = function(job, cb) {};