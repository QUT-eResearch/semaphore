var http = require('http');

console.log("worker pid:"+process.pid);

http.createServer(function(req, res) {
  console.log("worker run:"+process.pid);
  res.writeHead(200);
  res.end("hello world " + process.pid);
}).listen(8000);

console.log('worker test start');
setTimeout(function(){console.log('worker test end');},10000);


function prepareShutdown() {
}

function shutdown() {
  prepareShutdown();
  process.exit();
}
process.on('disconnect', function() {
  // shutting down
  console.log('worker disconnect 123'); 
});
process.on('SIGTERM', function() { console.log('worker SIGTERM'); shutdown(); });
process.on('SIGINT', function() { console.log('worker SIGINT'); shutdown(); });

process.on('message', function(msg) {
  console.log('worker.id = ' + msg);
});

console.log('worker is idle');
