/**
 *  Player schema in db
 */
const PlayerSchema = new Mongo.mongoose.Schema({
    id: {
        type: 'ObjectId'
    },
    name: {
        type: String
    },
    points: {
       type: Number
    }
});

module.exports = Mongo.mongoose.model('Player', PlayerSchema);