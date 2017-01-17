#!/usr/bin/env node

'use strict';

const app = require('./express');
const debug = require('debug')('app:server');
const error = require('debug')('app:error');
const http = require('http');


/* Get port from environment and store in Express. */
// normalize a port into a number, string, or false.
const normalizePort = (val) => {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
};

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


/* Create HTTP server. */
const server = http.createServer(app);

// listen on provided port, on all network interfaces.
server.listen(port);

// event listener for HTTP server 'error' event.
server.on('error', (err) => {
    if (err.syscall !== 'listen') {
        throw err;
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (err.code) {
        case 'EACCES':
            error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw err;
    }
});

// event listener for HTTP server 'listening' event.
server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    debug(`Listening on ${bind}`);
});
