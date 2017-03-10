/**
 * Represent socket logic
 */
class SocketController {
    /**
     * @method constructor
     * @description Create SocketController
     */
    constructor() {
        this.socket = require('socket.io');
        this.RoomController = require('./RoomController');
        this.roomId = 1;
    }

    /**
     * @method activateSocket
     * @description Init socket configuration
     * @param {object} io
     */
    activateSocket(io) {
        const nsp = io.nsps['/'];
        this.roomCtrl = new this.RoomController(this.roomId, io);
        io.on('connection', socket => {
            socket.on('get-game', player => {
                socket.removeAllListeners('get-game');
                const room = nsp.adapter.rooms[`room-${this.roomId}`];
                if ((room && room.length > 1) || !this.roomCtrl.canAcceptPlayer()) {
                    this.roomId++;
                    this.roomCtrl = new this.RoomController(this.roomId, io)
                }

                this.roomCtrl.joinPlayer(player, socket);
            });
        });
    }
}

module.exports = SocketController;
