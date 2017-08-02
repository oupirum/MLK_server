import * as handler from '../bin/handler';
import { Client } from '../bin/client';
import * as rooms from '../bin/rooms';
import fs from 'fs';

describe('handler;', ()=> {
	let client;
	let messages;
	
	beforeEach(()=> {
		rooms._resetRooms();
		let filenames = fs.readdirSync(rooms.PERSIST_DIR);
		filenames.forEach((filename)=> {
			fs.unlinkSync(`${rooms.PERSIST_DIR}/${filename}`);
		});
		
		client = createClient('client1');
		messages = [];
		client.onMessage((message)=> {
			messages.push(message);
		});
		
		jasmine.clock().install();
	});
	
	afterEach(()=> {
		jasmine.clock().uninstall();
	});
	
	
	it('should set name;', ()=> {
		setName('qwe');
		expect(client.name).toBe('qwe');
		
		function setName(name) {
			handler.handle({
				event: 'set_name',
				payload: {
					name: name,
				}
			}, client);
		}
	});
	
	describe('create_room;', ()=> {
		it('should create room;', ()=> {
			createRoom('test room');
			
			let room = rooms._rooms['1'];
			expect(room.name).toBe('test room');
			expect(client.room).toBe(room);
			expect(room.clients[client.id]).toBe(client);
		});
		
		it('should send response;', ()=> {
			createRoom('test room');
			
			expect(messages.length).toBe(1);
			expect(messages[0].payload.id).toBe('1');
			expect(messages[0].payload.name).toBe('test room');
		});
	});
	
	describe('connect;', ()=> {
		beforeEach(()=> {
			createRoom('test');
		});
		
		it('should save link to room;', ()=> {
			connect('1');
			
			let room = rooms._rooms['1'];
			expect(client.room).toBe(room);
		});
		
		it('should add client to list;', ()=> {
			connect('1');
			
			let room = rooms._rooms['1'];
			expect(room.clients[client.id]).toBe(client);
		});
		
		it('should send list of connected users;', ()=> {
			let client2 = createClient('client2');
			let messages = [];
			client2.onMessage((message)=> {
				messages.push(message);
			});
			
			connect('1', client2);
			
			expect(messages.length).toBe(2);
			expect(messages[0].event).toBe('client_connected');
			expect(messages[0].payload.id).toBe(client.id);
			
			expect(messages[1].event).toBe('client_connected');
			expect(messages[1].payload.id).toBe(client2.id);
		});
		
		it('should persist room after some time if 2 or more connected;', (done)=> {
			let client2 = createClient('client2');
			connect('1', client2);
			
			expect(fs.existsSync(`${rooms.PERSIST_DIR}/room_1`)).toBe(false);
			jasmine.clock().tick(11000);
			
			jasmine.clock().uninstall();
			setTimeout(()=> {
				expect(fs.existsSync(`${rooms.PERSIST_DIR}/room_1`)).toBe(true);
				
				done();
			}, 5);
		});
	});
	
	describe('leave;', ()=> {
		beforeEach(()=> {
			createRoom('test');
		});
		
		it('should remove client from list;', ()=> {
			leave('1');
			
			let room = rooms._rooms['1'];
			expect(Object.keys(room.clients).length).toBe(0);
			expect(client.room).toBeNull();
		});
		
		it('should broadcast message about disconnection;', ()=> {
			messages = [];
			let client2 = createClient('client2')
			connect('1', client2);
			
			leave('1', client2);
			
			expect(messages.length).toBe(2);
			expect(messages[0].event).toBe('client_connected');
			expect(messages[0].payload.id).toBe(client2.id);
			
			expect(messages[1].event).toBe('client_left');
			expect(messages[1].payload.id).toBe(client2.id);
		});
		
		it('should delete room after some time if all disconnected;', (done)=> {
			let client2 = createClient('client2');
			connect('1', client2);
			
			jasmine.clock().tick(11000);
			
			jasmine.clock().uninstall();
			setTimeout(()=> {
				expect(fs.existsSync(`${rooms.PERSIST_DIR}/room_1`)).toBe(true);
				
				jasmine.clock().install();
				leave('1');
				leave('1', client2);
				
				jasmine.clock().tick(61000);
				
				expect(Object.keys(rooms._rooms).length).toBe(0);
				
				jasmine.clock().uninstall();
				setTimeout(()=> {
					expect(fs.existsSync(`${rooms.PERSIST_DIR}/room_1`)).toBe(false);
					
					done();
				}, 5);
			}, 5);
		});
	});
	
	describe('chat message;', ()=> {
		beforeEach(()=> {
			createRoom('test');
		});
		
		it('should broadcast;', ()=> {
			let client2 = createClient('client2');
			connect('1', client2);
			
			let messages2 = [];
			client2.onMessage((message)=> {
				messages2.push(message);
			});
			messages = [];
			
			message(client, 'qwe');
			
			expect(messages.length).toBe(1);
			expect(messages[0].event).toBe('message');
			expect(messages[0].payload.text).toBe('qwe');
			
			expect(messages2.length).toBe(1);
			expect(messages2[0].event).toBe('message');
			expect(messages[0].payload.text).toBe('qwe');
		});
		
		it('should cut and trim text;', ()=> {
			let client2 = createClient('client2');
			connect('1', client2);
			messages = [];
			
			message(client, ' qw \t '.repeat(47));
			
			expect(messages[0].payload.text).toBe('qw '.repeat(47).substr(0, 140));
		});
	});
	
	
	function createRoom(name) {
		handler.handle({
			event: 'create_room',
			payload: {
				name: name,
			}
		}, client);
	}
	
	function connect(id, _client) {
		handler.handle({
			event: 'connect',
			payload: {
				id: id,
			}
		}, _client || client);
	}
	
	function leave(id, _client) {
		handler.handle({
			event: 'leave',
			payload: {}
		}, _client || client);
	}
	
	function message(client, text) {
		handler.handle({
			event: 'message',
			payload: {
				text: text,
			}
		}, client);
	}
	
	function createClient(id) {
		let client = new Client(id);
		client.onMessage((message, source)=> {});
		return client;
	}
});
