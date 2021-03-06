'use strict';

/*
 * RADIUS Authentication
 * https://tools.ietf.org/html/rfc2865
 */

const debug = require('debug');
const dgram = require('dgram');
const glob = require('glob');
const mongoose = require('mongoose');

const log = debug('authorization');
const logError = debug('authorization:error');
const { MONGO } = require('./config.js');
const server = dgram.createSocket('udp4');


/* Initialize Database */
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${MONGO}`);
mongoose.connection.on('error', err => {
  logError(`unable to connect to database at ${MONGO}`);
  logError(err);
});
glob.sync('./models/*.js')
  .forEach(model => require(model));


/* Start Server */
server.on('listening', () => {
  const address = server.address();
  log(`listening on ${address.address}:${address.port}`);
});

server.on('message', require('./controllers/authorization.js')(server));

server.on('error', err => {
  logError(err);
  server.close();
});

server.bind(1812);
