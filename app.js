'use strict';

const debug = require('debug');
const dgram = require('dgram');
const glob = require('glob');
const mongoose = require('mongoose');
const radius = require('radius');
const logError = debug('error');
const mongo = require('./config.json').mongo;


/* initialize database */
mongoose.connect(`mongodb://${mongo.host}:${mongo.port}/${mongo.database}`);
mongoose.connection.on('error', () => {
    const msg = `unable to connect to database at ${mongo.host}:${mongo.port}/${mongo.database}`;
    logError(new Error(msg));
});

const models = glob.sync('./models/*.js');
models.forEach((model) => {
    require(model);
});


/* start authentication server */
const authServer = require('./authServer.js');

/* start accounting  server */
const acctServer = require('./acctServer.js');
