'use strict';

const async = require('async');
const debug = require('debug');
const dgram = require('dgram');
const glob = require('glob');
const mongoose = require('mongoose');

const log = debug('bootstrap:server');
const logError = debug('bootstrap:error');
const { MONGO_HOST, MONGO_PORT, MONGO_DATABASE } = require('./config.js');
const server = dgram.createSocket('udp4');


/* Initialize Database */
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`);
mongoose.connection.on('error', err => {
    logError(`unable to connect to database at ${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`);
    logError(err);
});
glob.sync('./models/*.js')
    .forEach(model => require(model));


const Users = mongoose.model('Users');
const NAS = mongoose.model('NAS');

async.parallel([
    next => {
        new NAS({
                id: 'FF:FF:FF:FF:FF:FF',
                organization: 'ace-tide',
                login: {
                    guest: true,
                    email: true
                },
                assets: {
                    logo: 'img/logo.png',
                    url: 'http://ace-tech-solutions.com.my',
                    slogan: 'Welcome to ACE Guest WiFi'
                }
            })
            .save()
            .then(nas => {
                const message = 'Bootstrap NAS has been created.';
                next(null, true);
            })
            .catch(err => {
                // logError(JSON.stringify(err, null, 2));
                logError(err.message);
                next(null, false);
            });
    },
    next => {
        new Users({
                username: 'aaa',
                password: 'fd635cf7502be9481f2f315d2c0e816fe87ea54da9d862d04ea383a81064a9a8', // bbb?
                organization: 'ace-tide'
            })
            .save()
            .then(user => {
                const message = 'Bootstrap User has been created.';
                next(null, true);
            })
            .catch(err => {
                // logError(JSON.stringify(err, null, 2));
                logError(err.message);
                next(null, false);
            });
    }
], (err, result) => {
    log(`${result[0]}, ${result[1]}`);
    mongoose.connection.close();
});