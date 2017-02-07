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
const {
    MONGO_USER,
    MONGO_PASS,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DB
} = require('./config.js');
const server = dgram.createSocket('udp4');


/* Initialize Database */
mongoose.Promise = global.Promise;
// mongoose.connect(`mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`);
mongoose.connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`);
mongoose.connection.on('error', err => {
    logError(`unable to connect to database at ${MONGO_USER}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`);
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
