
export class Client {
	constructor(id, socket) {
		this._id = id;
		this._socket = socket;
	}
	
	get id() {
		return this._id;
	}
	
	get name() {
		return this._name || 'anonymous';
	}
	
	set name(name) {
		this._name = name;
	}
	
	send(message, source) {
		if (!message.room_id && this.room) {
			message.room_id = this.room.id;
		}
		if (!message.sender_id) {
			message.sender_id = this.id;
		}
		
		message.time = new Date().valueOf();
		
		if (this._onMessage) {
			this._onMessage(message, source);
		} else {
			this.socket.sendMessage(message);
		}
	}
	
	onMessage(cb) {
		this._onMessage = cb;
	}
}
