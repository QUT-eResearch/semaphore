var path = require('path');
var fsx = require('jsx').fsx;
var logger = require('jsx').Logger(module);

function makecb(fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    fn.apply(undefined, args);
  };
}

module.exports = function (rel) {
  var jobs = rel.jobs;
  //console.log(rel.conf.pathTempUpload);

  /** List all jobs */
  rel.get('', function (req, res) {
    jobs.getJobIdsByRange(0, -1, function(err, ids) {
      res.json(ids);
    });
  });

  /** List all supported job types */
  rel.get('/type', function (req, res) {
    res.json(rel.conf.jobTypes);
  });

  /** List all jobs of a specific type */
  rel.get('/type/:type', function (req, res) {
    var type = req.params.type;
    if (!rel.conf.jobTypes[type]) {
      res.json({ error: 'Invalid job type.' });
      return;
    }
    jobs.getJobIdsByType(type, function(err, ids) {
      res.json(ids);
    });
  });

  rel.post('/debug', function (req, res) {
    logger.debug(req.params);
    var buf = '';
    req.on('data', function(data) {
      buf += data;
    });
    req.on('end', function() {
      logger.debug(buf);
    });
    res.send('ok');
  });

  /// Submit a job to the queue
  /// Input:json
  /// InputFile or InputFile[]: uploaded file(s)
  rel.post('/type/:type', rel.bodyParserUpload, function (req, res) {
    var protocols = ['http', 'https', 'ftp'];
    function isFile(text) {
      for (var i = 0; i < protocols.length; ++i) {
        if (text.indexOf(protocols[i] + '://') === 0) return true;
      }
      return false;
    }

    // Check job type
    if (!rel.conf.jobTypes[req.params.type]) {
      return res.json({ error: 'Invalid job type.' });
    }

    var input = {}, inputFiles = {};

    try {
      var pInput = req.body[rel.conf.str.paramJsonInput];
      var pInputFiles = req.body[rel.conf.str.paramJsonInputFiles];
      if (pInput && pInput.trim().length > 0) {
        input = JSON.parse(pInput);
      }
      if (pInputFiles && pInputFiles.trim().length > 0) {
        inputFiles = JSON.parse(pInputFiles);
      }
    } catch (ex) {
      logger.error(ex);
      return res.json({ error: rel.conf.str.paramJsonInput + ' or ' + rel.conf.str.paramJsonInputFiles + ' parsing error.' });
    }

    delete req.body[rel.conf.str.paramJsonInput];
    delete req.body[rel.conf.str.paramJsonInputFiles];

    for (var key in req.body) {
      var value = req.body[key];
      if (isFile(value)) {
        inputFiles[key] = value;
      } else {
        input[key] = value;
      }
    }

    // Create a job
    jobs.create({type:req.params.type}, initJob);

    // prepare input storage
    function initJob(job) {
      var jobDir = path.join(rel.conf.pathJobData, job.id + '');
      fsx.async.createDir(jobDir, handleInputFiles);

      // process uploaded input files
      var counter = 0;
      function handleInputFiles(err) {
        if (err) {
          logger.error('BUG: ' + err);
          return;
        }
        if (req.files[rel.conf.str.paramInputFiles]) {
          processUpload(req.files[rel.conf.str.paramInputFiles]);
          delete req.files[rel.conf.str.paramInputFiles];
        }
        for (var key in req.files) {
          processUpload(req.files[key], key);
        }
        if (counter === 0) finished();
      }
      function processUpload(uploadedFile, key) {
        function move(file) {
          counter++;
          fsx.async.move(file.path, path.join(jobDir, file.name), finished);
          inputFiles[file.name] = rel.conf.getUrlToJobDataFile(job.id, file.name);
          //console.log(inputFiles);
        }
        if (Array.isArray(uploadedFile)) {
          uploadedFile.forEach(move);
        } else {
          if (typeof key !== 'undefined') uploadedFile.name = key;
          // Process one file
          move(uploadedFile);
        }
      }

      function finished() {
        console.log('counter='+counter);
        --counter;
        if (counter <= 0) {
          logger.debug('finished processing files, saving job data..')
          //TODO: find the matching job engine and validate the input before submitting to the job queue

          //console.log(job);
          // Submit job after ensuring that the uploaded input files is accessible.
          job.data = {input: input, inputFiles: inputFiles};
          jobs.save(job, function() {
            jobs.submit(job, function() {
              logger.debug(job);
              res.json(job);
            });
          });
          
        }
      }

    }
  });

  /** Remove all jobs from queue */
  rel['delete']('', function (req, res) {
    res.send('remove all jobs');
  });

  rel.get('/state/:id', function (req, res) {
    jobs.getJobState(req.params.id, function(err, state) {
      if (state) res.json({"state": state});
      else res.json({error:'no job with given id exists.'});
    });
  });

  rel.get('/id/:id', function (req, res) {
    jobs.getJobById(req.params.id, function(job) {
      //logger.debug(job);
      if (job) res.json(job);
      else res.json({error:'no job with given id exists.'});
    });
  });

  rel.get('/output/:id', function (req, res) {
    jobs.getJobById(req.params.id, function(job) {
      //logger.debug(job);
      var outputFiles='';
      if (job) {
        for (var f in job.data.outputFiles) {
          outputFiles += (f + ',' + job.data.outputFiles[f] + '\n');
        }
      }
      res.send(outputFiles);
    });
  });


  // update job
  rel.put('/id/:id', function (req, res) {
    res.send('update job ' + req.params.id);
  });

  rel['delete']('/id/:id', function (req, res) {
    res.send('Remove job ' + req.params.id);
  });

};