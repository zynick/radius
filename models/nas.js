'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const nasSchema = new Schema({
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
    collection: 'nas',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('NAS', nasSchema);
