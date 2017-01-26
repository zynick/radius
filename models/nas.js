'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const nasSchema = new Schema({

    // MAC address will be the NAS id
    id: { type: String, required: true, index: true, unique: true },
    company: { type: String, index: true },

    secret: String,
    lastseen: Date

}, {
    versionKey: false,
    collection: 'nas',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('NAS', nasSchema);
