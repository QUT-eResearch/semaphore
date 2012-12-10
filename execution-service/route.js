/*
 * Automatic route loader based on file naming convention.
 * This module will traverse `./routes` folder and create routing paths based on the *.js files.
 */

var methods = require('methods');
var path = require('path');
var fs = require('fs');
var logger = require('jsx').Logger(module);
var conf = require('./conf');
var JobQueue = require('redis-jobq');
var jobs = new JobQueue();

var rel = {conf:conf, jobs: jobs};
var parentPath = '';

module.exports = function(app) {
  methods.forEach(function(method) {
    rel[method] = function(path, fn) {
      var args = Array.prototype.slice.call(arguments, 1);
      args.unshift(parentPath + path);
      app[method].apply(app, args);
    }
  })
  rel.all = function(path) {
    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(parentPath + path);
    app.all.apply(app, args);
  }
  rel.bodyParser = require('express').bodyParser();
  rel.bodyParserUpload = require('express').bodyParser({ keepExtensions: true, uploadDir: conf.pathTempUpload });

  var stack = [];
  var dir, files;
  var moduleDir = {route:'', path:'routes'};
  console.log(moduleDir);
  stack.push(moduleDir);
  while (dir = stack.pop()) {
    files = fs.readdirSync(dir.path);
    files.forEach( function(filename) {
      var fp = path.join(dir.path, filename);
      var stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        stack.push({route:dir.route+'/'+filename, path:fp});
      } else if (path.extname(filename)==='.js') {
        parentPath = dir.route;
        var baseName = path.basename(filename, '.js');
        if (baseName !== 'index') parentPath += '/' + baseName;
        logger.debug('Setup route: ' + parentPath);
        try {
          require('./routes' + parentPath)(rel);
        } catch(err) {
          logger.error(err);
        }
      }
    });
  }
  


}