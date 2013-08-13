var logger = require('jsx').createLogger(module);

function makecb(fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    fn.apply(undefined, args);
  };
}

module.exports = function (rel) {
  var jobs = rel.jobs;
  
  /** List all jobs */
  rel.get('', function (req, res) {
    var type = req.query.type;
    if (type) {
      if (!rel.conf.jobTypes[type]) {
        res.json({ error: 'Invalid job type.' });
        return;
      }
      jobs.jobs({type:type}, function(err, ids) {
        res.json(ids);
      });
    } else {
      jobs.jobs({start:0, stop:-1}, function(err, ids) {
        res.json(ids);
      });
    }
  });
  
  rel.get('/:id', function (req, res) {
    jobs.job(req.params.id, function(err, job) {
      if (job) {
        var j = {};
        j.id = job.id;
        j.type = job.type;
        j.priority = job.priority;
        j.state = job.state;
        j.data = job.data;
        j.updatedAt = job.updatedAt;
        j.createdAt = job.updatedAt;
        res.json(j);
      } else {
        res.send(404);
      }
    });
  });
  
  rel.get('/:id/state', function (req, res) {
    jobs.jobState(req.params.id, function(err, state) {
      if (state) res.json({"state": state});
      else res.send(404);
    });
  });

  rel.get('/:id/output', function (req, res) {
    jobs.job(req.params.id, function(err, job) {
      if (job && job.data && job.data.outputFiles) res.send(job.data.outputFiles);
      else res.send(404);
    });
  });
  
  var protocols = ['http', 'https', 'ftp'];
  function isFile(text) {
    for (var i = 0; i < protocols.length; ++i) {
      if (text.indexOf(protocols[i] + '://') === 0) return true;
    }
    return false;
  }
  
  /*
   * Submit a job to the queue
   */
  rel.post('', rel.bodyParser, function (req, res, next) {
    // Check job type
    var type = req.body.type;
    if (!rel.conf.jobTypes[type]) {
      return res.json({ error: 'Invalid job type.' });
    }
    var data = req.body.data;
    
    if (data && ((typeof data.input === 'object' && Object.keys(data.input).length > 0) || (typeof data.inputFiles === 'object' && Object.keys(data.inputFiles).length > 0))) {
      // Create a job
      jobs.create({type:type, data:data}, submitJob);
    } else {
      res.json({ error: 'empty input' });
    }

    // prepare input storage
    //function initJob(job) {
    //  var jobDir = path.join(rel.conf.pathJobData, job.id + '');
    //  fsx.async.createDir(jobDir, submitJob);
    //}
    function submitJob(err, job) {
      if (err) return next(err);
      if (!job) return res.send(500);
      else jobs.submit(job, function(err) {
        if (err) return next(err);
        logger.debug(job);
        res.send(202);
      });
    }

  });
  
  
};

