const Router = require('express').Router;
class BaseController {
    constructor() {
        this.routes = new Router();
    }
}

module.exports = BaseController;
