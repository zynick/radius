'use strict';

const debug = require('debug');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');

const log = debug('web:server');
const logError = debug('web:error');
const routes = require('./routes');


/* Initialize Express */
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', routes);

// normalize environment port into a number, string (named pipe), or false.
function normalizePort(val) {
    let port = parseInt(val, 10);
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
