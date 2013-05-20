var net = require('net');
var PORT = 33000;
var HOST = '127.0.0.1';

var client = new net.Socket();
client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    client.write("shutdown");
    process.exit();
});