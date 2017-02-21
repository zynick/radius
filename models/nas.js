'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { NODE_ENV } = require('../config.js');
const Schema = mongoose.Schema;

const nasSchema = new Schema({

    id: {
        type: String,
        required: 'NAS Id is required.',
        index: true,
        unique: 'NAS Id already exists.'
    },

    organization: {
        type: String,
        required: 'Organization is required.',
        index: true
    },

    login: {
        email: {
            type: Boolean,
            required: 'Login is required.'
        },
        guest: Boolean
    },

    assets: {
        logo: {
            type: String,
            required: 'Assets is required.'
        },
        url: String,
        slogan: String,
        announcement: String
    },

    secret: String,
    lastseen: Date

}, {
    versionKey: false,
    collection: 'nas',
    autoIndex: NODE_ENV !== 'production'
});

nasSchema.plugin(uniqueValidator);

// Error Handling Middleware
const errorHandler = (err, doc, next) => {
    err.originalMessage = err.message;
    const keys = Object.keys(err.errors);
    err.message = keys[0] ? err.errors[keys[0]].message : err.message;
    err.status = 400;
    next(err);
};

nasSchema.post('save', errorHandler);
nasSchema.post('update', errorHandler);

mongoose.model('NAS', nasSchema);
