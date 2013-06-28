"use strict";
var fs = require('fs');
var path = require('path');
var logger = require('jsx').createLogger(module);
var exec = require('child_process').exec;
var platform = (process.platform.indexOf('win') >= 0)? 'win':'unix';
var str = {
  win: {
    batchSeparator: '&',
    ext: '.exe',
    logOutputs: ' >>output.log 2>&1'
  },
  unix: {
    batchSeparator: ';',
    ext: '',
    logOutputs: ' >>output.log 2>&1'
  }
}[platform];
str.platform = platform;

module.exports = ExternalExecutor;
/*
 * Execute an array of external commands in one go.
 */
function ExternalExecutor(cmds, args) {
  if (!cmds) throw new Error('cmds must not be empty');
  if (!Array.isArray(cmds)) cmds = [cmds];
  this.cmds = cmds;
  if (args) {
    if (!Array.isArray(args)) args = [args];
    this.args = args;
  }
}
ExternalExecutor.str = str;
var p = ExternalExecutor.prototype;

p.isValid = function() {
  for (var i=0; i<this.cmds.length; ++i) {
    var cmd = this.cmds[i];
    if (!fs.existsSync(cmd)) return false;
  }
  return true;
};

/** must return array, otherwise command will not be executed */
p.getCmdArgs = function(params) {
  if (params && params.args) return params.args;
  else if (this.args) return this.args;
  else return [];
};

p.createCommand = function(params) {
  var args = this.getCmdArgs(params);
  if (!Array.isArray(args)) return;
  var cmds = '', sep = '';
  for (var i=0; i<this.cmds.length; ++i) {
    var cmd = this.cmds[i];
    var arg = args[i];
    if (arg && arg.length > 0) {
      cmd = cmd + ' ' + arg;
    }
    cmds = cmds + sep + cmd;
    sep = str.batchSeparator;
  }
  return cmds;
};

/**
 * onFinish(err Error, stdout Buffer, stderr Buffer)
*/
p.run = function(params, onFinish) {
  if (!onFinish && typeof params === 'function') {
    onFinish = params;
    params = {};
  }
  params = params || {};
  try {
    var cmd = this.createCommand(params);
  } catch (err) {
    return onFinish(err);
  }
  logger.debug('run cmd: '+cmd);
  if (cmd) {
    var options = {};
    if (params.workDir) options.cwd = params.workDir;
    if (params.envVars) options.env = params.envVars;
    exec(cmd, options, onFinish);
  }
};
