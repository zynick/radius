// https://tools.ietf.org/html/rfc2866#page-23

'use strict';

const mongoose = require('mongoose');
const { NODE_ENV } = require('../config.js');
const Schema = mongoose.Schema;

const accountingSchema = new Schema({

    date: { type: Date, index: true, default: Date.now },
    username: { type: String, index: true },
    nasId: { type: String, index: true },

    attributes: Schema.Types.Mixed

}, {
    versionKey: false,
    collection: 'accounting',
    autoIndex: NODE_ENV !== 'production'
});

mongoose.model('Accounting', accountingSchema);