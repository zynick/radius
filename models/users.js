'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({

    username: { type: String, required: true, index: true },
    password: String

}, {
    versionKey: false,
    collection: 'users',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('Users', userSchema);
