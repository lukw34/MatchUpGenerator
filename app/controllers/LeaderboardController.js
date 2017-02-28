const BaseController = require('./BaseController');

class GameController extends BaseController {
    constructor() {
        super();
        this.Player = require('../models/Player');
    }

    save(name, points) {
        const player = new this.Player({name, points});
        player.save();
    }

    getLeaders(req, res) {
        this.Player.find({}).sort('-points').limit(10).exec((err, list) => {
            if (err) {
                res.status(400).send({message: err.message})
            } else {
                res.status(200).send(list);
            }
        })

    }
}
module.exports = GameController;