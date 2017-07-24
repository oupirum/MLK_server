import { Room } from './room';

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
	if (client.room) {
		if (client.room.id !== id) {
			leave(client);
		} else {
			return;
		}
	}
	
	let room = rooms[id];
	if (!room) {
		throw new Error('room with id "' + id + '" does not exist');
	}
	if (Object.keys(room.clients).length >= room.limit) {
		throw new Error('could not connect because of limit of clients reached');
	}
	
	Object.keys(room.clients).forEach((clientId)=> {
		client.send({
			event: 'client_connected',
			payload: {
				id: clientId,
				name: room.clients[clientId].name
			}
		}, 'connect to room');
	});
	
	room.clients[client.id] = client;
	room.broadcast(client, {
		event: 'client_connected',
		payload: {
			id: client.id,
			name: client.name
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
				id: client.id
			}
		}, 'leave');
	}
	
	client.room = null;
}
