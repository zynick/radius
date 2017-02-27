'use strict';

const async = require('async');
const debug = require('debug');
const glob = require('glob');
const mongoose = require('mongoose');

const log = debug('radius:boot');
const { MONGO, NODE_ENV } = require('./config.js');


/* Initialize Database */
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${MONGO}`);
mongoose.connection.on('error', err => {
  log(`unable to connect to database at ${MONGO}`);
  log(err);
});
glob.sync('./models/*.js')
  .forEach(model => require(model));


const NAS = mongoose.model('NAS');


/* Bootstrap Data */
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
            logo: '../img/logo.png',
            url: 'http://ace-tech-solutions.com.my',
            slogan: 'Welcome to ACE Guest WiFi',
            announcement: '../img/announcement.jpeg'
          }
        })
        .save((err, doc) => {
          log(err ? err.message : 'Bootstrap NAS has been created.');
          next();
        });
    }
  ],
  () => mongoose.connection.close());
