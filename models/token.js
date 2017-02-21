'use strict';

const mongoose = require('mongoose');
const { NODE_ENV } = require('../config.js');
const Schema = mongoose.Schema;

const tokenSchema = new Schema({

  organization: {
    type: String,
    required: true
  },

  mac: {
    type: String,
    required: true
  },

  token: {
    type: String,
    required: true
  }

}, {
  versionKey: false,
  collection: 'tokens',
  autoIndex: NODE_ENV !== 'production'
});

tokenSchema.index({ organization: 1, mac: 1 }, { unique: 1 });

mongoose.model('Tokens', tokenSchema);
