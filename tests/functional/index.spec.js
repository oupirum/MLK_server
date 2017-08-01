import net from 'net';
import readline from 'readline';
import JsonSocket from 'json-socket';

describe(';', ()=> {
	beforeEach(()=> {
		
	});
	
	afterEach(()=> {
		
	});
	
	it(';', ()=> {
		
	});
	
	function connect() {
		let socket = new JsonSocket(new net.Socket());
		socket.connect(8081, '127.0.0.1');
		socket.on('connect', ()=> {
			console.log('connected to server');
		});

		socket.on('message', (message)=> {
			console.log('received from server:', message);
		});

		socket.on('end', ()=> {
			console.log('disconnected from server');
		});
		
		return socket;
	}
});
