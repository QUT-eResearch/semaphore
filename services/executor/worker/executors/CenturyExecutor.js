"use strict";

var fs = require('fs');
var path = require('path');
var jsx = require('jsx');
var logger = jsx.createLogger(module);
var endsWith = jsx.string.endsWith;
var ExternalExecutor = require('./ExternalExecutor');
var str = ExternalExecutor.str;

module.exports = CenturyExecutor;
function CenturyExecutor(options) {
  var base = path.join(options.pathBase, options.name);
  var bin = path.join(base, options.dirBin);
  this.name = options.name;
  if (options.dirDefaultInput) this.defaultInputPath = path.join(base, options.dirDefaultInput);
  this.outvars = options.outvars || '';
  var cmds = ['',''];
  cmds[0] = path.join(bin, options.name + str.ext);
  cmds[1] = path.join(bin, options.list100 + str.ext);
  ExternalExecutor.call(this, cmds);
}
var p = CenturyExecutor.prototype = Object.create(ExternalExecutor.prototype);

p.isValid = function() {
  if (!this.defaultInputPath || !fs.existsSync(this.defaultInputPath)) logger.warn(this.name + ' - dirDefaultInput is invalid: ' + this.defaultInputPath);
  return ExternalExecutor.prototype.isValid.call(this);
};

/** 
 * params.sch String Schedule file
 * params.bin String Binary file from other simulation to be used as input
*/
p.getCmdArgs = function(params) {
  params = params || {};
  params.data = params.data || {};
  var scheduleFile;
  var prevBinaryFile;
  for (var f in params.data.inputFiles) {
    if (endsWith(f, '.sch')) scheduleFile = f.substring(0, f.length-4);
    else if (endsWith(f, '.bin')) prevBinaryFile = f.substring(0, f.length-4);
  }
  if (!scheduleFile) {
    throw new Error('Please provide valid inputs to run CENTURY/DAYCENT.');
  }
  var args = ['',''];
  var extParam = prevBinaryFile ? (' -e ' + prevBinaryFile) : '';
  args[0] = '-s ' + scheduleFile + ' -n ' + scheduleFile + extParam + str.logOutputs;
  args[1] = scheduleFile + ' ' + scheduleFile + ' ' + this.outvars + str.logOutputs;
  return args;
};