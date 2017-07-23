var net = require('net');
var readline = require('readline');
var JsonSocket = require('json-socket');

var socket = new JsonSocket(new net.Socket());
socket.connect(8081, '127.0.0.1');
socket.on('connect', function() {
	console.log('connected to server');
});

socket.on('message', function(message) {
	console.log('received from server:', message);
});

socket.on('end', function() {
	console.log('disconnected from server');
});


var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.on('line', function(line) {
	var message = {};
	var terms = line.split(' ');
	message.event = terms[0];
	if (terms.length > 1) {
		var payload = terms.slice(1).join(' ');
		try {
			payload = JSON.parse(payload);
		} catch(err) {
			payload = { test: payload };
		}
		message.payload = payload;
	}
	socket.sendMessage(message);
});
