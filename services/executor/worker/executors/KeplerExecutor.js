"use strict";
var ExternalExecutor = require('./ExternalExecutor');

module.exports = KeplerExecutor;
function KeplerExecutor() {
  ExternalExecutor.call(this, 'kepler');
}
var p = KeplerExecutor.prototype = Object.create(ExternalExecutor.prototype);
