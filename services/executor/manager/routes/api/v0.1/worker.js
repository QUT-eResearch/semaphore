/**
 * API for processing the jobs by a worker.
 *
 * GET /api/1/worker/process
 *   Retrieve a job of any type. The job will be taken from the longest queue of all the available job types.
 * GET /api/1/worker/process/[job type]
 *   Retrieve a job of a particular type.
 *
 */
var logger = require('jsx').createLogger(module);
var fs = require('fs');

module.exports = function (rel) {
  var jobs = rel.jobs;

  rel.get('', function(req, res){
    res.send('ok');
  });

  rel.put('/upload/:id/:filename', function(req,res) {
    var id = req.params.id;
    var filename = req.params.filename;
    var ws = fs.createWriteStream(rel.conf.getPathToJobDataFile(id, filename));
    ws.on('error', function() {
      res.json({error: 'Job no found.'});
    });
    ws.on('close', function() {
      var r = {};
      r[filename] = rel.conf.getUrlToJobDataFile(id, filename);
      res.json(r);
    });
    req.pipe(ws);
  });

  rel.get('/process', function(req, res){
    if (req.query && req.query.confirm) {
      var confirmedId = req.query.confirm;
      jobs.confirmReserve({id:confirmedId}, function() {
        res.json({confirm:1});
      });
    } else {
      jobs.longestQueue(function(err, type) {
        if (!type) return res.json({});
        logger.debug('GET /process Processing job of type: ' + type);
        jobs.reserve(type, function(err, job) {
          logger.debug(job);
          if (job) {
             res.json(job);
          } else {
            res.json({});
          }
        });
      });
    }
  });

  rel.put('/end/:id', function(req, res){
    var id = req.params.id;
    var buf = '';
    req.on('data', function(data) {
      buf += data;
    });
    req.on('end', function() {
      var job = JSON.parse(buf);
      logger.debug(job);
      jobs.save(job, function() {
        jobs.finish(job, function(e, r){
          logger.debug('job '+id+' has been finished.');
          logger.debug(e);
          res.json({});
        });
      });
    });
  });

};