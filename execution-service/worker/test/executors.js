var ex = require('../executors');

var exex = new ex.ExternalExecutor(['echo test', 'echo test1', 'echo test2'],['p1','p2','p3']);
exex.run({}, function(err,stdout,stderr){
  console.log(stdout);
});

var opt = {
  basePath: 'C:\\dev\\models',
  binDir: 'bin',
  defaultInputDir: 'param',
  list100: 'list100'
};

var ce = new CenturyExecutor('century', opt);
var de = new CenturyExecutor('daycent', opt);
console.log(ce.cmds);
ce.run({scheduleName:'test'}, function(err,stdout,stderr){
  console.log(stdout);
  de.run({scheduleName:'test'}, function(err,stdout,stderr){
    console.log(stdout);
  });
});
console.log('ce.isValid():'+ce.isValid());
console.log('de.isValid():'+de.isValid());