'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const nasSchema = new Schema({

    // MAC address will be the NAS id
    id: { type: String, required: true, index: true, unique: true },
    organization: { type: String, index: true },

    // sample format:
    // { enabled: true, email: true, facebook: true, google: true, ... }
    login: Schema.Types.Mixed,

    assets: {
        logo: String,
        url: String,
        slogan: String
    },

    secret: String,
    lastseen: Date

}, {
    versionKey: false,
    collection: 'nas',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('NAS', nasSchema);
