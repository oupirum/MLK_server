import { Room } from './room';
import fs from 'fs';

const rooms = {};
let lastRoomId = 0;

export const PERSIST_DIR = 'persisted_rooms';

if (!fs.existsSync(PERSIST_DIR)) {
	fs.mkdirSync(PERSIST_DIR);
}


export function createAndConnect(name, client) {
	if (client.room) {
		leave(client);
	}
	
	lastRoomId++;
	let id = lastRoomId.toString();
	let room = createRoom(id, name);
	
	room.clients[client.id] = client;
	client.room = room;
}

export function connect(id, client) {
	if (client.room && client.room.id === id) {
		return;
	}
	
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
	
	client.room = room;
	sendListOfClients(client, room);
	room.clients[client.id] = client;
	broadcastConnected(client, room);
	
	if (Object.keys(room.clients).length === 2) {
		delayedPersist(room);
	}
}

export function leave(client) {
	let room = client.room;
	if (!room) {
		return;
	}
	
	delete room.clients[client.id];
	if (Object.keys(room.clients).length > 0) {
		room.broadcast(client, {
			event: 'client_left',
			payload: {
				id: client.id
			}
		}, 'leave');
	} else {
		delayedDelete(room);
	}
	
	client.room = null;
}


function createRoom(id, name) {
	let room = new Room(id, name);
	rooms[id] = room;
	return room;
}

function sendListOfClients(client, room) {
	Object.keys(room.clients).forEach((clientId)=> {
		client.send({
			event: 'client_connected',
			payload: {
				id: clientId,
				name: room.clients[clientId].name
			}
		}, 'connect to room');
	});
}

function broadcastConnected(client, room) {
	room.broadcast(client, {
		event: 'client_connected',
		payload: {
			id: client.id,
			name: client.name
		}
	}, 'connect to room');
}


function delayedPersist(room) {
	setTimeout(()=> {
		if (Object.keys(room.clients).length >= 2) {
			persist(room);
		}
	}, 10000);
}

function delayedDelete(room) {
	setTimeout(()=> {
		if (Object.keys(room.clients).length === 0) {
			delete rooms[room.id];
			deletePersisted(room);
		}
	}, 60000);
}


function persist(room) {
	fs.writeFile(
			roomPath(room.id),
			room.name,
			(err)=> {
				if (err) {
					console.error('error on persisting room:', err);
				}
			});
}

function deletePersisted(room) {
	let path = roomPath(room.id);
	if (fs.existsSync(path)) {
		fs.unlink(path, (err)=> {});
	}
}

export function restoreRooms() {
	return new Promise((resolve, reject)=> {
		fs.readdir(PERSIST_DIR, (err, filenames)=> {
			if (err) {
				reject(err);
				return;
			}
			
			let restored = 0;
			filenames.sort();
			filenames.forEach((filename)=> {
				try {
					let id = filename.split('_')[1];
					if (isNaN(parseInt(id))) {
						return;
					}
					let name = fs.readFileSync(
							roomPath(id),
							{ encoding: 'utf-8' });
					fs.unlinkSync(`${PERSIST_DIR}/${filename}`);
					if (!name) {
						return;
					}
					
					let room = createRoom(id, name);
					lastRoomId = parseInt(id);
					
					delayedDelete(room);
					
					restored++;
				} catch(err) {
					console.error(`error on restoring room from file "${filename}":`, err);
				}
			});
			resolve(restored);
		});
	});
}

function roomPath(id) {
	return `${PERSIST_DIR}/room_${id}`;
}


export { rooms as _rooms }

export function _resetRooms() {
	for (let id in rooms) {
		delete rooms[id];
	}
	lastRoomId = 0;
}
