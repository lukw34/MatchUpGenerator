const LeaderboardController = require('./LeaderboardController');

class RoomController {
    constructor(roomNo) {
        this.leaderboardCtrl = new LeaderboardController();
        this.roomId = `room-${roomNo}`;
        this.players = [];
        this.playerLimit = 2;
        this.playersOrder = [];

        this.points = {
            winner: 3,
            draw: 1,
            lost: -1
        }
    }

    joinPlayer(player, socket) {
        socket.join(this.roomId);
        logger.log(`${player.name} joined to ${this.roomId}`);
        const id = this.players.length;
        this.players.push(Object.assign({}, player, {id, socket}));
        this._handleDisconnect(socket, {id, name: player.name});
        if (id >= this.playerLimit - 1) {
            this._emitReady();
            this._handleNextTurn();
        }
    }

    _handleDisconnect(socket, {name, id}) {
        socket.on('disconnect', () => {
            logger.log(`${name} disconnect from room ${this.roomId}`);
            if (this.players.length < this.playerLimit) {
                socket.leave(this.roomId, () => {
                    this.players.splice(id, 1);
                    this.players
                        .filter(val => val.id >= id)
                        .map(val => Object.assign({}, val, {id: val.id - 1}));
                });
            } else {
                this.players
                    .filter(val => val.id !== id)
                    .forEach(({socket, name}) => {
                        socket.emit('player-disconnect');
                        this.leaderboardCtrl.save(name, this.points.winner).then(() => {
                            this._closeRoom();
                        });
                    });
            }
        });
    }

    _closeRoom() {
        this.players.forEach(({socket}) => socket.disconnect());
        this.players = [];
        this.playerLimit = 0;
    }

    _emitReady() {
        const firstPlayer = Math.round(Math.random() * (this.players.length - 1)),
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
        this._setPlayersOrder(firstPlayer);
    }

    _setPlayersOrder(first) {
        this.players.filter(({id}) => id !== first).forEach(({id}) => this.playersOrder.push(id));
        this.playersOrder.push(first);
    }


    _handleNextTurn() {
        this.players.forEach(({socket}) => {
            socket.on('turn-completed', ({fields, id, draw, winner}) => {
                if (draw) {
                    logger.log(`Draw in ${this.roomId}`);
                    const promises = [];
                    this.players.forEach(({name}) => promises.push(this.leaderboardCtrl.save(name, this.points.draw)));
                    Promise.all(promises).then(() => {
                        this._emitInRoom('result-draw');
                        this._closeRoom();
                    });

                } else if (winner) {
                    const {name, socket} = this.players[id],
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
                            this._closeRoom();
                        });
                } else {
                    const playerId = this._getNextPlayer();
                    logger.log(`Next turn in ${this.roomId} (PlayerId: ${playerId})`);
                    this._emitInRoom('next-turn', {fields, playerId});
                }
            });
        });
    }

    _emitInRoom(event, msg) {
        this.players.forEach(({socket}) => socket.emit(event, msg));
    }

    _getNextPlayer() {
        const nextPlayer = this.playersOrder.shift();
        this.playersOrder.push(nextPlayer);
        return nextPlayer;
    }

    canAcceptPlayer() {
        return this.players.length < this.playerLimit;
    }
}

module.exports = RoomController;
