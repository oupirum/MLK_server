import * as rooms from './rooms';

export function handle(message, client) {
	switch(message.event) {
		case 'set_name':
			setName(message.payload.name || '', client);
			break;
		case 'create_room':
			createRoom(message.payload.name || '', client);
			break;
		case 'connect':
			connect(message.payload.id, client);
			break;
		case 'leave':
			leave(client);
			break;
		case 'message':
			sendChatMessage(message.payload.text || '', client);
			break;
		case 'game_event':
			sendGameEvent(message.payload.data, client);
			break;
		default:
			throw new Error('unknown event "' + message.event + '"');
	}
}

export function disconnect(client) {
	rooms.leave(client);
}


function setName(name, client) {
	name = name.toString().trim().replace(/\s+/g, ' ');
	if (!name) {
		throw new Error('name required');
	}
	name = name.substr(0, 40);
	
	client.name = name;
}

function createRoom(name, client) {
	name = name.toString().trim().replace(/\s+/g, ' ');
	if (!name) {
		throw new Error('room name not specified');
	}
	if (name.length < 3 || name.length > 80) {
		throw new Error('room name must have length 3-80 characters');
	}
	
	rooms.create(name, client);
	
	client.send({
		event: 'room_created',
		payload: {
			id: client.room.id,
			name: client.room.name
		}
	}, 'create room');
}

function connect(id, client) {
	if (!id) {
		throw new Error('id required');
	}
	
	rooms.connect(id.toString(), client);
}

function leave(client) {
	let room = client.room;
	if (!room) {
		throw new Error('not connected to any room');
	}
	
	rooms.leave(client);
}

function sendChatMessage(text, client) {
	let room = client.room;
	if (!room) {
		throw new Error('not connected to any room');
	}
	
	text = text.toString().trim().replace(/\s+/g, ' ');
	if (!text) {
		throw new Error('text required');
	}
	text = text.substr(0, 140);
	
	room.broadcast(client, {
		event: 'message',
		payload: {
			text: text
		}
	}, 'send chat message');
}

function sendGameEvent(data, client) {
	let room = client.room;
	if (!room) {
		throw new Error('not connected to any room');
	}
	
	room.broadcast(client, {
		event: 'game_event',
		payload: {
			data: data
		}
	}, 'send game event');
}
