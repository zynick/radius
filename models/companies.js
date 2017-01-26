'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companySchema = new Schema({

    id: { type: String, required: true, index: true, unique: true },

    login: Schema.Types.Mixed,
    // sample format:
    // { guest: true, email: true, facebook: true, google: true, ... }

    assets: {
        name: String,
        logo: String,
        url: String,
        slogan: String
    }

}, {
    versionKey: false,
    collection: 'companies',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('Companies', companySchema);
