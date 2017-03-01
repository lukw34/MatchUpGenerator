const LeaderboardController = require('./LeaderboardController');

class RoomController {
    constructor(roomNo, io) {
        this.io = io;
        this.leaderboardCtrl = new LeaderboardController();
        this.roomId = `room-${roomNo}`;
        this.players = [];
        this.playerLimit = 2;
        this.room = this.io.sockets.in(this.roomId);

        this.points = {
            winner: 3,
            draw: 1,
            lost: -1
        }
    }

    joinPlayer(player, socket) {
        socket.join(this.roomId);
        const id = (this.players.length + 1).toString();
        this.room.emit('match-up');
        this.players.push(Object.assign({}, player, {id, socket}));
        if (id >= this.playerLimit) {
            this._emitReady();
            this._handleNextTurn();
        }
    }

    canAcceptPlayer() {
        return this.players.length < 2;
    }

    _emitReady() {
        const firstPlayer = (Math.floor(Math.random() * this.players.length) + 1).toFixed(0),
            game = {
                firstPlayer,
            };
        logger.log(`Match set in room  ${this.roomId}`);
        this.players.forEach(({socket}, key) => {
            const {name, id} = this.players[key],
                me = {name, id},
                opponents = this.players
                    .filter(({id}) => id !== me.id)
                    .map(({id, name}) => ({id, name})),
                gameData = Object.assign({}, game, {me, opponents});
            socket.emit('game-ready', gameData);
        });
    }

    _handleNextTurn() {
        this.players.forEach(({socket}) => {
            socket.on('turn-completed', ({fields, id, draw, winner}) => {
                if (draw) {
                    logger.log(`Draw in ${this.roomId}`);
                    const promises = [];
                    this.players.forEach(({name}) => promises.push(this.leaderboardCtrl.save(name, this.points.draw)));
                    Promise.all(promises).then(() => this._emitInRoom('result-draw'));
                } else if (winner) {
                    const {name, socket} = this.players[id - 1],
                        sockets = [];
                    this.leaderboardCtrl.save(name, this.points.winner)
                        .then(() => {
                            logger.log(`${name} is winner in ${this.roomId}`);
                            socket.emit('result-winner');
                            const promises = [];
                            this.players
                                .filter((val) => val.id !== id)
                                .forEach(({name, socket}) => {
                                    sockets.push(socket);
                                    promises.push(this.leaderboardCtrl.save(name, this.points.lost));
                                });
                            return Promise.all(promises);
                        })
                        .then(() => {
                            sockets.forEach(val => val.emit('result-looser'));
                        });
                } else {
                    logger.log(`Next turn in ${this.roomId}`);
                    this._emitInRoom('next-turn', {fields});
                }
            });
        });
    }

    _emitInRoom(event, msg) {
        this.players.forEach(({socket}) => socket.emit(event, msg));
    }
}

module.exports = RoomController;
