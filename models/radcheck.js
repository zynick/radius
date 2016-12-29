'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const radcheckSchema = new Schema({
    username: {
        type: String,
        required: true,
        index: true
    },
    attribute: String,
    op: String,
    value: String
}, {
    versionKey: false,
    collection: 'radcheck',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('radcheck', radcheckSchema);
