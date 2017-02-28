const Router = require('express').Router,
    leaderboardRoutes = require('./leaderboardRoutes'),
    router = new Router();

router.use('/api/leaderboard', leaderboardRoutes);

module.exports = router;
