const LeaderboardController = require('../controllers/LeaderboardController'),
    Leaderboard = new LeaderboardController();

Leaderboard.routes.route('/').get(Leaderboard.getLeaders.bind(Leaderboard));

module.exports = Leaderboard.routes;
