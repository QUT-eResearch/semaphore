"use strict";
var path = require('path');

var ExternalExecutor = require('./ExternalExecutor');
var str = ExternalExecutor.str;
var copyCmd = {
  win: function(inputDir, preDir, postDir) {
    return 'copy /Y ' + path.join(inputDir, '*') + ' ' + postDir + ' & copy /Y ' + path.join(preDir, '*') + ' ' + postDir;
  },
  unix: function(inputDir, preDir, postDir) {
    return 'ln -s ' + path.join(preDir, '*') + ' ' + postDir + '; ln -s ' + path.join(inputDir, '*') + ' ' + postDir;
  }
}[str.platform];

module.exports = CopyExecutor;
function CopyExecutor() {}

var p = CopyExecutor.prototype = Object.create(ExternalExecutor.prototype);

p.isValid = function() { return true; };
p.createCommand = function(params) {
  return copyCmd(params.inputDir, params.preDir, params.postDir);
};
