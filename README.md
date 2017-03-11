#MatchUpGenerator
***
###1. Description
It is socket server to create game session for given number of players.
Communication is set up by sockets. It's mean, that connection is full duplex.
Server is written in JavaScript with package defined in package.json. The most
important part of this list are:
   - [express](https://expressjs.com/) 
   - [socket.io](https://github.com/socketio/socket.io)
   - [mongoose](http://mongoosejs.com/)

###2. Installation and running
- You have to install mongodb and set up it on port 27017.
- In project directory run installation of dependencies
```bash 
$ npm install
```
- To run server use
 ```bash
 $ node app
 
 $ npm run start:server
 ```
###3. Events
| Event | Description | MessageExample |Type |
| ------ | ----------- | ---- | ---
| connection  | Fired when socket connect to server. | ```{}``` | **on**
| get-game | Fired when client socket want to join game. | ``` {name: 'playerName'}``` |**on**
| game-ready | Emit event if in room is given number of player. Message object contain properties: firstPlayer, me, opponents. | ```{firstPlayer: 1, me: {name: 'meName', id: 0}, opponents: [{name: 'opponentName', id: 1}]}``` | **emit**
| disconnect | Fired when socket disconnect. | ```{}``` | **on**
| player-disconnect | Emit when opponent disconnect to other players. | ```{}``` | **emit**
| turn-completed | Fired when player end turn. You should pass field object which contain common game structure like field values. | ```{fields: []}``` | **on**
| next-turn | Emit to all users in room if next urn is triggered. Send message with field to update view and id of player which should make move. | ```{fields: [], playerId: actualPlayerId}``` | **emit**
| completed-winner | Fired when actual player make winning move. | ```{id: playerId}``` | **on**
| result-winner | Emit to user which is a winner of game in room. | ```{}``` | **emit**
| result-looser | Emit to user(s) which lost game in room | ```{}``` | **emit**
| completed-draw | Fired when game end, but is no winner | ```{}``` | **on**
| result-draw | Emit information that is draw in room to all users | ```{}```| **emit**
###4. Example of game scenario
- connect to server
- emit **get-game** with your player information
- wait for **game-ready** event.
- use **turn-completed**, **completed-winner** and **completed-draw** to deal with game logic. 

###5. Example apps
- [CrossRings](https://github.com/lukw34/CrossRings)