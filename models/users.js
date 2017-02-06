'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { NODE_ENV } = require('../config.js');
const Schema = mongoose.Schema;

const userSchema = new Schema({

    username: {
        type: String,
        required: 'Username is required.',
        index: true
    },

    organization: {
        type: String,
        required: 'Organization is required.'
    },

    password: String,
    nasId: String,
    created: {
        type: Date,
        default: Date.now
    }

}, {
    versionKey: false,
    collection: 'users',
    autoIndex: NODE_ENV !== 'production'
});

userSchema.index({ organization: 1, username: 1 }, { unique: 'Username already exists.' });

userSchema.plugin(uniqueValidator);

// Error Handling Middleware
const errorHandler = (err, doc, next) => {
    err.originalMessage = err.message;
    const keys = Object.keys(err.errors);
    err.message = keys[0] ? err.errors[keys[0]].message : err.message;
    err.status = 400;
    next(err);
};

userSchema.post('save', errorHandler);
userSchema.post('update', errorHandler);

mongoose.model('Users', userSchema);
