/**
 * Class to log information/warnings/errors
 */
class Logger {
    constructor() {
        this.colors = require('colors');
        this.dateFormat = require('dateformat');
    }

    _getDate() {
        return this.dateFormat(new Date(), "mmmm dS, yyyy, h:MM:ss TT");
    }

    warn(warning) {
        console.log(`${this._getDate()}: ${this.colors.yellow(warning)}`);
    }

    error(error) {
        console.log(`${this._getDate()}: ${this.colors.red.bold(error)}`);
    }

    log(log) {
        console.log(`${this._getDate()}: ${this.colors.green.underline(log)}`);
    }
}

module.exports = Logger;
