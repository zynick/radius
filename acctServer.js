'use strict';

/*
 * RADIUS Accounting
 * https://tools.ietf.org/html/rfc2866
 */


const debug = require('debug');
const dgram = require('dgram');
const glob = require('glob');
const mongoose = require('mongoose');

const log = debug('acct:server');
const logError = debug('acct:error');
const { mongo } = require('./config.json');
const server = dgram.createSocket('udp4');


/* Initialize Database */
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${mongo.host}:${mongo.port}/${mongo.database}`);
mongoose.connection.on('error', err => {
    logError(`unable to connect to database at ${mongo.host}:${mongo.port}/${mongo.database}`);
    logError(err);
});
glob.sync('./models/*.js')
    .forEach(model => require(model));


/* Start Server */
server.on('listening', () => {
    const address = server.address();
    log(`listening on ${address.address}:${address.port}`);
});


server.on('message', require('./controllers/accounting.js')(server));

server.on('error', err => {
    logError(err);
    server.close();
});

server.bind(1813);
