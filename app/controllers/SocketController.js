class SocketController {
    constructor() {
        this.socket = require('socket.io');
        this.RoomController = require('./RoomController');
        this.roomId = 1;
    }

    activateSocket(io) {
        const nsp = io.nsps['/'];
        this.roomCtrl = new this.RoomController(this.roomId, io);
        io.on('connection', socket => {
            logger.log('Client was joined');
            socket.on('get-game', player => {
                const room = nsp.adapter.rooms[`room-${this.roomId}`];
                if (room && room.length > 1) {
                    this.roomId++;
                    this.roomCtrl = new this.RoomController(this.roomId, io)
                }

                this.roomCtrl.joinPlayer(player, socket);
            });
        });
    }

}

module.exports = SocketController;