'use strict';

const bodyParser = require('body-parser');
const debug = require('debug');
const express = require('express');
const http = require('http');
const morgan = require('morgan');

const log = debug('webServer');
const logError = debug('error');
const routes = require('./routes');


/* Initialize Express */
const app = express();
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', routes);

// normalize environment port into a number, string (named pipe), or false.
function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}
const port = normalizePort(process.env.PORT || 3000);
app.set('port', port);


/* Create HTTP server. */
const server = http.createServer(app);

server.listen(port);

server.on('error', (err) => {
    if (err.syscall !== 'listen') {
        throw err;
    }
    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
    switch (err.code) {
        case 'EACCES':
            logError(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logError(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw err;
    }
});

server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    log(`Listening on ${bind}`);
});
