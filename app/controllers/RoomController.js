class RoomController {
    constructor(roomNo, io) {
        this.io = io;
        this.roomId = `room-${roomNo}`;
        this.players = [];
        console.log(this.roomId);
    }

    joinPlayer(player, socket) {
        socket.join(this.roomId);
        this.io.sockets.in(this.roomId).emit('matchUp', "You are in room no. " + this.roomId);
        const id = player.length + 1;
        this.players.push(Object.assign({}, player, {id, socket}));
    }
}

module.exports = RoomController;
