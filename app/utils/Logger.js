class Logger {

    constructor() {
        this.colors = require('colors');
    }

    warn(warning) {
        console.log(this.colors.yellow(warning));
    }

    error(error) {
        console.log(this.colors.red.bold(error));
    }

    log(log) {
        console.log(this.colors.underline(log));
    }
}

module.exports = Logger;
