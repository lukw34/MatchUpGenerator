const Router = require('express').Router;

/**
 * BaseController for controllers attached to routing
 */
class BaseController {
    /**
     * @method constructor
     * @description Create base controller
     */
    constructor() {
        this.routes = new Router();
    }
}

module.exports = BaseController;
