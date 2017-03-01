const BaseController = require('./BaseController');

class GameController extends BaseController {
    constructor() {
        super();
        this.Player = require('../models/Player');
    }

    save(name, points) {
        return this.Player.findOne({name}, (err, player) => {
            if(err) {
               logger.error(err);
               return Promise.reject();
            } else if (player) {
                player.points += points;
                return player.save()
            } else {
                return new this.Player({name, points}).save();
            }
        });
    }

    getLeaders(req, res) {

        this.Player.find({}).sort('-points').limit(10).exec((err, list) => {
            if (err) {
                res.status(400).send({message: err.message})
            } else {
                res.status(200).send(list);
            }
        });

    }
}
module.exports = GameController;