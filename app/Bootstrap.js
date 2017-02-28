class Bootstrap {
    constructor() {
        const Logger = require('./utils/Logger'),
            SocketController = require('./controllers/SocketController');

        this.Express = require('express');
        this.MongooseUtils = require('./utils/Mongo');
        const winston = require('winston');
        this.winstonLogger = new (winston.Logger)({transports: [new (winston.transports.Console)({colorize: true})]});

        this.port = process.env.PORT || 9004;
        this.socket = new SocketController();
        this.mongo = 'mongodb://localhost/matchUpGenerator';

        //global variable
        global.logger = new Logger();
        global.Mongo = new this.MongooseUtils(require('mongoose'));

    }

    run() {
        global.logger.log('Run application ...');

        global.Mongo.connect(this.mongo).then(() => {
            this._startExpress(require('./routes'))
        }).catch(({message}) => {
           global.logger.error(message);

        });
    }

    _startExpress(routes) {
        const app = new this.Express(),
            http = require('http').Server(app),
            io = require('socket.io')(http);

        this.socket.activateSocket(io);
        app.use(require('winston-request-logger').create(this.winstonLogger, {
            'method': ':method',
            'url': ':url[pathname]'
        }));

        app.use('/', routes);

        this.server = http.listen(this.port, err => {
            if (err) {
                global.logger.error('Application runtime error !');
            } else {
                global.logger.log(`Application start on port: ${this.port}`)
            }
        });

        this.server.on('error', err => {
            global.logger.error('Application runtime error !');
            process.exit(1);
        })


    }
}

module.exports = Bootstrap;