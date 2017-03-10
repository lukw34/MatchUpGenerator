const LeaderboardController = require('./LeaderboardController');

/**
 * Class representing controller for room
 */
class RoomController {

    /**
     * @method constructor
     * @description Create RoomController
     * @param {number} roomNo id
     */
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

    /**
     * @method joinPlayer
     * @description Contain logic  with joining player to room.
     * @param  {object} player
     * @param {object} socket
     */
    joinPlayer(player, socket) {
        if (!this._checkIfPlayerExist(player.name)) {
            this._handleJoining(player, socket);
        }

    }

    /**
     * @method _checkIfPlayerExist
     * @param {string} playerName
     * @returns {boolean} if player exist in game room
     * @private
     */
    _checkIfPlayerExist(playerName) {
        return this.players.filter(({name}) => name === playerName).length != 0;
    }

    /**
     * @method _handleJoining
     * @description Fired when player join game room
     * @param {Object} player
     * @param {Object} socket
     * @private
     */
    _handleJoining(player, socket) {
        socket.join(this.roomId);
        logger.log(`${player.name} joined to ${this.roomId}`);
        const id = this.players.length;
        this.players.push(Object.assign({}, player, {id, socket}));
        this._handleDisconnect(socket, {id, name: player.name});
        if (id >= this.playerLimit - 1) {
            this._emitReady();
            this._handleNextTurn();
            this._handleWinner();
            this._handleDraw();
        }
    }

    /**
     * @method _handleDisconnect
     * @description react on client disconnection from socket server
     * @param {Object} socket
     * @param {string} name
     * @param {Number} id
     * @private
     */
    _handleDisconnect(socket, {name, id}) {
        socket.on('disconnect', () => {
            logger.log(`${name} disconnect from room ${this.roomId}`);
            if (this.players.length != this.playerLimit) {
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

    /**
     * @method _closeRoom
     * @description method which handle closing room
     * @private
     */
    _closeRoom() {
        this.playerLimit = 0;
        this.players.forEach(({socket}) => socket.disconnect());
        this.players = [];
    }

    /**
     * @method _emitReady
     * @description send information to player if number of players is sufficient
     * @private
     */
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

    /**
     * @method _setPlayerOrder
     * @description generate table with player orders
     * @param {Object} firstPlayer
     * @private
     */
    _setPlayersOrder(firstPlayer) {
        this.players.filter(({id}) => id !== firstPlayer).forEach(({id}) => this.playersOrder.push(id));
        this.playersOrder.push(firstPlayer);
    }

    /**
     * @method _handleNextTurn
     * @description logic connected with changing turn between players
     * @private
     */
    _handleNextTurn() {
        this.players.forEach(({socket}) => {
            socket.on('turn-completed', ({fields}) => {
                const playerId = this._getNextPlayer();
                logger.log(`Next turn in ${this.roomId} (PlayerId: ${playerId})`);
                this._emitInRoom('next-turn', {fields, playerId});
            });
        });
    }

    /**
     * @method _handleWinner
     * @description logic connected with winning game by one of the player
     * @private
     */
    _handleWinner() {
        this.players.forEach(({socket}) => {
            socket.on('completed-winner', ({id}) => {
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
            });
        });
    }

    /**
     * @method _handleDraw
     * @description logic connected with draw in game
     * @private
     */
    _handleDraw() {
        this.players.forEach(({socket}) => {
            socket.on('completed-draw', () => {
                logger.log(`Draw in ${this.roomId}`);
                const promises = [];
                this.players.forEach(({name}) => promises.push(this.leaderboardCtrl.save(name, this.points.draw)));
                Promise.all(promises).then(() => {
                    this._emitInRoom('result-draw');
                    this._closeRoom();
                });
            });
        });
    }

    /**
     * @method _emitInRoom
     * @description method emit given message to all player in room
     * @param {string} event
     * @param {string | object} msg
     * @private
     */
    _emitInRoom(event, msg) {
        this.players.forEach(({socket}) => socket.emit(event, msg));
    }

    /**
     * @method _getNextPlayer
     * @description Get next player and modify players order array
     * @returns {Object} next player in order
     * @private
     */
    _getNextPlayer() {
        const nextPlayer = this.playersOrder.shift();
        this.playersOrder.push(nextPlayer);
        return nextPlayer;
    }

    /**
     * @method canAcceptPlayer
     * @description Check if in room is empty space
     * @returns {boolean}
     */
    canAcceptPlayer() {
        return this.players.length < this.playerLimit;
    }
}

module.exports = RoomController;