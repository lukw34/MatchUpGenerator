const Router = require('express').Router,
    router = new Router();

router.use('/api', (req, res) => res.statusCode(200));

module.exports = router;
