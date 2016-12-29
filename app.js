'use strict';

const dgram = require('dgram');
const glob = require('glob');
const mongoose = require('mongoose');
const radius = require('radius');
const {
    secret,
    mongo
} = require('./config/config.json');


/* initialize database */
mongoose.connect(`mongodb://${mongo.host}:${mongo.port}/${mongo.database}`);
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database at ${mongo.host}:${mongo.port}/${mongo.database}`);
});

const models = glob.sync('./models/*.js');
models.forEach((model) => {
    require(model);
});


/* start authentication server */
const authServer = require('./authServer.js')(secret);

/* start accounting  server */
const acctServer = require('./acctServer.js');




// const radcheck = mongoose.model('radcheck');
// radcheck.findOne({}, (err, result) => {
//     console.log(err);
//     console.log(result);
// });
