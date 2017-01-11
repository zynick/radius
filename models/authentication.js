'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const authenticationSchema = new Schema({

    username: {
        type: String,
        required: true,
        index: true
    },
    attribute: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    }

    // what are the settings needed?
    // 'User-Name': String,
    // 'User-Password': String,
    // 'CHAP-Password': String,
    // 'NAS-IP-Address': String,
    // 'NAS-Port': String,
    // 'Service-Type': String,
    // 'Framed-Protocol': String,
    // 'Framed-IP-Address': String,
    // 'Framed-IP-Netmask': String,
    // 'Framed-Routing': String,
    // 'Filter-Id': String,
    // 'Framed-MTU': String,
    // 'Framed-Compression': String,
    // 'Login-IP-Host': String,
    // 'Login-Service': String,
    // 'Login-TCP-Port': String,
    // 'Reply-Message': String,
    // 'Callback-Number': String,
    // 'Callback-Id': String,
    // 'Framed-Route': String,
    // 'Framed-IPX-Network': String,
    // 'State': String,
    // 'Class': String,
    // 'Vendor-Specific': String,
    // 'Session-Timeout': String,
    // 'Idle-Timeout': String,
    // 'Termination-Action': String,

}, {
    versionKey: false,
    collection: 'authentication',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('authentication', authenticationSchema);