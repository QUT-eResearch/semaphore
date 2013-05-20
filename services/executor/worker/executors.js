var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var su = require('jsx').string;
var logger = require('jsx').Logger(module);
var Class = require('jsx').Class;

var platform = (process.platform.indexOf('win') >= 0)? 'win':'unix';
var str = {
  win: {
    batchSeparator: '&',
    ext: '.exe',
    logOutputs: ' >>output.log 2>&1',
    copyCmd: function(inputDir, preDir, postDir) {
      return 'copy /Y ' + path.join(inputDir, '*') + ' ' + postDir + ' & copy /Y ' + path.join(preDir, '*') + ' ' + postDir;
    }
  },
  unix: {
    batchSeparator: ';',
    ext: '',
    logOutputs: ' >>output.log 2>&1',
    copyCmd: function(inputDir, preDir, postDir) {
      return 'ln -s ' + path.join(preDir, '*') + ' ' + postDir + '; ln -s ' + path.join(inputDir, '*') + ' ' + postDir;
    }
  }
}[platform];

/*
 * Execute an array of external commands in one go.
 */
exports.ExternalExecutor = Class('ExternalExecutor', {
  _init: function ExternalExecutor(cmds, args) {
    if (!Array.isArray(cmds)) cmds = [cmds];
    this.cmds = cmds;
    if (args) {
      if (!Array.isArray(args)) args = [args];
      this.args = args;
    }
  },
  isValid: function() {
    for (var i=0; i<this.cmds.length; ++i) {
      var cmd = this.cmds[i];
      if (!fs.existsSync(cmd)) return false;
    };
    return true;
  },
  // must return array, otherwise command will not be executed
  getCmdArgs: function(params) {
    if (params.args) return params.args;
    else if (this.args) return this.args;
    else return [];
  },
  createCommand: function(params) {
    var args = this.getCmdArgs(params);
    if (!args) return;
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
  },
  run: function(params, onFinish) {
    var cmd = this.createCommand(params);
    logger.debug('execute: '+cmd);
    if (cmd) {
      var options = {};
      if (params.workDir) options.cwd = params.workDir;
      if (params.envVars) options.env = params.envVars;

      exec(cmd, options, onFinish);
    }
  }  
});

exports.CenturyExecutor = Class('CenturyExecutor', {
  _extends: ExternalExecutor,
  _init: function CenturyExecutor(name, options) {
    var base = path.join(options.basePath, name);
    var bin = path.join(base, options.binDir);
    this.name = name;
    if (options.defaultInputDir) this.defaultInputPath = path.join(base, options.defaultInputDir);
    this.outvars = options.outvars ? options.outvars : 'outvars.txt';
    var cmds = ['',''];
    cmds[0] = path.join(bin, name + str.ext);
    cmds[1] = path.join(bin, options.list100 + str.ext);
    this._super(cmds);
  },
  isValid: function() {
    if (!this.defaultInputPath || !fs.existsSync(this.defaultInputPath)) logger.warn(this.name + ' - defaultInputDir is invalid: ' + this.defaultInputPath);
    return this._invoke(ExternalExecutor, 'isValid', []);
  },
  getCmdArgs: function(params) {
    var scheduleFile, prevBinaryFile;
    if (!params || !params.data.inputFiles) {
      logger.error('Please provide valid inputs to run CENTURY.');
      return;
    }
    for (var f in params.data.inputFiles) {
      if (su.endsWith(f, '.sch')) scheduleFile = f.substring(0, f.length-4);
      else if (su.endsWith(f, '.bin')) prevBinaryFile = f.substring(0, f.length-4);
    }
    var args = ['',''];
    var extParam = prevBinaryFile ? (' -e ' + prevBinaryFile) : '';
    args[0] = '-s ' + scheduleFile + ' -n ' + scheduleFile + extParam + str.logOutputs;
    args[1] = scheduleFile + ' ' + scheduleFile + ' ' + this.outvars + str.logOutputs;
    return args;
  }
});

exports.KeplerExecutor = Class('KeplerExecutor', {
  _extends: ExternalExecutor,
  _init: function KeplerExecutor() {
    this._super('kepler');
  }
});

exports.CopyExecutor = Class('CopyExecutor', {
  _extends: ExternalExecutor,
  _init: function CopyExecutor() {
  },
  createCommand: function(params) {
    return str.copyCmd(params.inputDir, params.preDir, params.postDir);
  }  
});