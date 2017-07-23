import { Room } from './room';

console.log('rooms.js imported');
const rooms = {};
let lastRoomId = 0;

export function create(name, client) {
	if (client.room) {
		leave(client);
	}
	
	lastRoomId++;
	let id = lastRoomId.toString();
	
	let room = new Room(id, name);
	room.clients[client.id] = client;
	rooms[id] = room;
	client.room = room;
}

export function connect(id, client) {
	let room = rooms[id];
	if (!room) {
		throw new Error('room with id "' + id + '" does not exist');
	}
	if (Object.keys(room.clients).length >= room.limit) {
		throw new Error('could not connect because of limit of clients reached');
	}
	
	if (client.room) {
		leave(client);
	}
	
	room.clients[client.id] = client;
	room.broadcast(client, {
		event: 'client_connected',
		payload: {
			client_id: client.id
		}
	}, 'connect to room');
	
	client.room = room;
}

export function leave(client) {
	let room = client.room;
	if (!room) {
		return;
	}
	
	delete room.clients[client.id];
	if (Object.keys(room.clients).length === 0) {
		delete rooms[room.id];
	} else {
		room.broadcast(client, {
			event: 'client_left',
			payload: {
				client_id: client.id
			}
		}, 'leave');
	}
	
	client.room = null;
}
