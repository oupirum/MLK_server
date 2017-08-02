import * as handler from '../bin/handler';
import { Client } from '../bin/client';
import * as rooms from '../bin/rooms';
import fs from 'fs';

describe('restore rooms;', ()=> {
	let clients;
	let messages;
	
	beforeEach(()=> {
		rooms._resetRooms();
		let filenames = fs.readdirSync(rooms.PERSIST_DIR);
		filenames.forEach((filename)=> {
			fs.unlinkSync(`${rooms.PERSIST_DIR}/${filename}`);
		});
		
		clients = [
			createClient('client1'),
			createClient('client2')
		];
		messages = [];
		for (let i in clients) {
			messages.push([]);
			clients[i].onMessage((message)=> {
				messages[i].push(message);
			});
		}
		
		jasmine.clock().install();
	});
	
	afterEach(()=> {
		jasmine.clock().uninstall();
	});
	
	
	it('should restore;', (done)=> {
		persist(()=> {
			expect(Object.keys(rooms._rooms).length).toBe(0);
			expect(fs.existsSync(`${rooms.PERSIST_DIR}/room_1`)).toBe(true);
			
			rooms.restoreRooms().then((restored)=> {
				expect(restored).toBe(2);
				
				expect(Object.keys(rooms._rooms).length).toBe(2);
				expect(rooms._rooms['1'].name).toBe('room 1');
				expect(rooms._rooms['2'].name).toBe('room 2');
				
				expect(fs.existsSync(`${rooms.PERSIST_DIR}/room_1`)).toBe(false);
				
				done();
			}).catch((err)=> {
				done(err || 'should restore');
			});
		});
	});
	
	it('should delete restored room if still empty;', (done)=> {
		persist(()=> {
			jasmine.clock().install();
			rooms.restoreRooms().then((restored)=> {
				expect(restored).toBe(2);
				expect(Object.keys(rooms._rooms).length).toBe(2);
				
				jasmine.clock().tick(61000);
				
				expect(Object.keys(rooms._rooms).length).toBe(0);
				
				done();
			});
		});
	});
	
	it('should correctly update last id;', (done)=> {
		persist(()=> {
			rooms.restoreRooms().then((restored)=> {
				let client = createClient('client3');
				createRoom('room 3', client);
				
				expect(rooms._rooms['3'].name).toBe('room 3');
				
				done();
			});
		});
	});

	
	function persist(cb) {
		persistRoom(1);
		persistRoom(2);
		
		jasmine.clock().uninstall();
		setTimeout(()=> {
			rooms._resetRooms();
			cb();
		}, 5);
	}
	
	function persistRoom(n) {
		createRoom('room ' + n, clients[0]);
		connect(n.toString(), clients[1]);
		jasmine.clock().tick(11000);
	}
	
	function createClient(id) {
		let client = new Client(id);
		client.onMessage((message, source)=> {});
		return client;
	}
	
	function createRoom(name, client) {
		handler.handle({
			event: 'create_room',
			payload: {
				name: name,
			}
		}, client);
	}
	
	function connect(id, client) {
		handler.handle({
			event: 'connect',
			payload: {
				id: id,
			}
		}, client);
	}
});
