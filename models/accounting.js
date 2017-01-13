'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountingSchema = new Schema({

    date: Date,
    attributes: Schema.Types.Mixed

}, {
    versionKey: false,
    collection: 'accounting',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('accounting', accountingSchema);