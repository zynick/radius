'use strict';

const mongoose = require('mongoose');
const { NODE_ENV } = require('../config.js');
const Schema = mongoose.Schema;

const nasSchema = new Schema({

    id: { type: String, required: true, index: true, unique: true },
    organization: { type: String, required: true, index: true },

    login: {
        email: { type: Boolean, required: true },
        guest: Boolean
    },

    assets: {
        logo: { type: String, required: true },
        url: String,
        slogan: String
    },

    secret: String,
    lastseen: Date

}, {
    versionKey: false,
    collection: 'nas',
    autoIndex: NODE_ENV !== 'production'
});

mongoose.model('NAS', nasSchema);
