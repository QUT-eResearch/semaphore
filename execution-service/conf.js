var path = require('path');
var conf = {};

//conf.pathBaseData = '/data';
conf.host = 'localhost:3000';
conf.pathBaseData = 'C:\\temp';
conf.pathTempUpload = path.join(conf.pathBaseData, 'upload');
conf.pathJobData = path.join(conf.pathBaseData, 'jobs');
conf.urlJobData = 'http://'+conf.host+'/files/';

conf.getPathToJobDataFile = function(jobId, fileName) {
  return path.join(conf.pathJobData, jobId, fileName)
}
conf.getUrlToJobDataFile = function(jobId, fileName) {
  return conf.urlJobData + jobId + '/' + fileName;
}

conf.jobTypes = {
  century: 'century',
  daycent: 'daycent',
  kepler: 'kepler'
};

conf.str = {};
conf.str.paramJsonInput = 'JsonInput';
conf.str.paramJsonInputFiles = 'JsonInputFiles';
conf.str.paramInputFiles = 'InputFiles';

module.exports = conf;