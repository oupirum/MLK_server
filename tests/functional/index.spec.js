import net from 'net';
import JsonSocket from 'json-socket';
import { spawn } from 'child_process';

describe('client;', ()=> {
	let server;
	let sockets;
	let messages;
	
	beforeEach((done)=> {
		server = spawn('node', ['./bin/index.js']);
		server.stdout.on('data', (data)=> {
			console.log('server:', data.toString());
		});
		server.stderr.on('data', (data)=> {
			console.log('server:', data.toString());
		});
		
		setTimeout(()=> {
			sockets = [];
			messages = [];
			for (let i = 0; i < 3; i++) {
				messages.push([]);
				sockets.push(createSocket((message)=> {
					messages[i].push(message);
				}));
			}
			
			done();
		}, 100);
	});
	
	afterEach(()=> {
		server.kill('SIGINT');
	});
	
	
	it('create room;', (done)=> {
		createRoom(sockets[0], 'room 1');
		
		setTimeout(()=> {
			expect(messages[0][0].event).toBe('room_created');
			expect(messages[0][0].payload.id).toBe('1');
			expect(messages[0][0].payload.name).toBe('room 1');
			expect(messages[0][0].room_id).toBe('1');
			
			done();
		}, 30);
	});
	
	it('connect several clients;', (done)=> {
		createRoom(sockets[0], 'room 1');
		connect(sockets[1], '1');
		connect(sockets[2], '1');
		
		setTimeout(()=> {
			expect(messages[0].length).toBe(3);
			expect(messages[0][0].event).toBe('room_created');
			expect(messages[0][0].room_id).toBe('1');
			expect(messages[0][1].event).toBe('client_connected');
			expect(messages[0][1].room_id).toBe('1');
			expect(messages[0][1].payload.name).toBe('anonymous');
			expect(messages[0][2].event).toBe('client_connected');
			expect(messages[0][2].room_id).toBe('1');
			
			expect(messages[0][1].sender_id).not.toBe(messages[0][2].sender_id);
			
			
			expect(messages[1].length).toBe(3);
			expect(messages[1][0].event).toBe('client_connected');
			expect(messages[1][1].event).toBe('client_connected');
			expect(messages[1][2].event).toBe('client_connected');
			expect(messages[1][2].payload.id).toBe(messages[1][2].sender_id);
			
			expect(messages[1][0].sender_id).toBe(messages[1][1].sender_id);
			expect(messages[1][1].sender_id).not.toBe(messages[1][2].sender_id);
			
			
			expect(messages[2].length).toBe(3);
			expect(messages[2][0].event).toBe('client_connected');
			expect(messages[2][2].payload.id).toBe(messages[2][2].sender_id);
			
			expect(messages[2][0].sender_id).toBe(messages[2][2].sender_id);
			
			done();
		}, 30);
	});
	
	it('reconnect;', (done)=> {
		createRoom(sockets[0], 'room 1');
		connect(sockets[1], '1');
		connect(sockets[2], '1');
		
		setTimeout(()=> {
			createRoom(sockets[1], 'room 2');
			
			setTimeout(()=> {
				expect(messages[0].length).toBe(4);
				expect(messages[0][3].event).toBe('client_left');
				
				expect(messages[1].length).toBe(4);
				expect(messages[1][3].event).toBe('room_created');
				expect(messages[1][3].payload.id).toBe('2');
				expect(messages[1][3].room_id).toBe('2');
				
				expect(messages[2].length).toBe(4);
				expect(messages[2][3].event).toBe('client_left');
				
				expect(messages[0][3].sender_id).toBe(messages[1][3].sender_id);
				expect(messages[1][3].sender_id).toBe(messages[2][3].sender_id);
				
				done();
			}, 30)
		}, 30);
	});
	
	function createRoom(socket, name) {
		socket.sendMessage({
			event: 'create_room',
			payload: {
				name: name
			}
		});
	}
	
	function connect(socket, roomId) {
		socket.sendMessage({
			event: 'connect',
			payload: {
				id: roomId
			}
		});
	}
	
	function createSocket(onMessage) {
		let socket = new JsonSocket(new net.Socket());
		socket.connect(8081, '127.0.0.1');
		socket.on('message', onMessage);
		return socket;
	}
});
