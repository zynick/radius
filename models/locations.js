'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({

    id: { type: String, required: true, index: true, unique: true },

    login: Schema.Types.Mixed,
    // sample format:
    // { enabled: true, email: true, facebook: true, google: true, ... }

    assets: {
        name: String,
        logo: String,
        url: String,
        slogan: String
    }

}, {
    versionKey: false,
    collection: 'locations',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('Locations', locationSchema);
