import net from 'net';
import JsonSocket from 'json-socket';
import { handle, disconnect } from './handler';
import { Client } from './client';

let server = net.createServer();

server.on('connection', (socket)=> {
	console.log('client connected');
	socket = new JsonSocket(socket);
	let client = new Client(generToken(16), socket);
	
	client.onMessage((message, source)=> {
		// TODO preprocess message & log
		if (!message || !message.event || !message.payload) {
			console.error('trying to send incorrect message from "' + source + '"');
			return;
		}
		socket.sendMessage(message);
	});
	
	socket.on('message', (message)=> {
		console.log('received from client:', message);
		if (!message.event || !message.payload) {
			socket.sendError('incorrect format, message must contain "event" and "payload" required fields');
			return;
		}
		try {
			handle(message, client);
		} catch(err) {
			console.error('error on handling message:', err);
			socket.sendError(err && err.message || 'could not handle message');
		}
	});
	
	socket.on('end', ()=> {
		console.log('client disconnected');
		try {
			disconnect(client);
		} catch(err) {
			console.error('error on handling client disconnection');
		}
	});
});

server.listen({ port: 8081 }, ()=> {
	console.log('listening...');
});


function generToken(len) {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).
				substring(1);
	}
	
	var token = '';
	for (var i = 0, c = Math.ceil(len / 4); i < c; i++) {
		token += s4();
	}
	
	return token.substr(0, len);
}