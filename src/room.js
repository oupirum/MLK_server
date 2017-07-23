
export class Room {
	constructor(id, name) {
		this._id = id;
		this._name = name;
		this._clients = {};
		this._limit = 5;
	}
	
	get id() {
		return this._id;
	}
	
	get name() {
		return this._name;
	}
	
	get clients() {
		return this._clients;
	}
	
	get limit() {
		return this._limit;
	}
	
	broadcast(sender, message, source) {
		Object.keys(this.clients).forEach((clientId)=> {
			message.room_id = this.id;
			message.sender_id = sender.id;
			message.time = new Date().valueOf();
			
			let client = this.clients[clientId];
			client.send(message, source);
		});
	}
}
