class RoomController {
    constructor(roomNo, io) {
        this.io = io;
        this.roomId = `room-${roomNo}`;
        this.players = [];
        this.playerLimit = 2;
    }

    joinPlayer(player, socket) {
        socket.join(this.roomId);
        const id = (this.players.length + 1).toString();
        this.io.sockets.in(this.roomId).emit('match-up', {id});
        this.players.push(Object.assign({}, player, {id, socket}));
        if (id >= this.playerLimit) {
            this._emitReady();
        }
    }

    _emitReady() {
        const firstPlayer = Math.round(Math.random() + this.players.length).toFixed(0),
            game = {
                firstPlayer,
            };
        this.players.forEach(({socket}, key) => {
            const {player, id} = this.players[key],
                me = {player, id},
                opponents = this.players
                    .filter(({id}) => id !== me.id)
                    .map(({id, name}) => ({id, name})),
                gameData = Object.assign({}, game, {me, opponents});
            socket.emit('game-ready', gameData);
        });
    }
}

module.exports = RoomController;
