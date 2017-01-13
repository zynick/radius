'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// TODO change this schema! you should have User collection and NAS collection wtf!
// TODO what should i do with this collection? use it as logger? just like accounting?

const authenticationInsertSchema = new Schema({

    username: {
        type: String,
        index: true
    },
    nasId: {
        type: String,
        index: true
    },
    attributes: Schema.Types.Mixed

}, {
    versionKey: false,
    collection: 'authentication',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('AuthenticationInsert', authenticationInsertSchema);


const authenticationSchema = new Schema({

    username: {
        type: String,
        index: true
    },
    nasId: {
        type: String,
        index: true
    },
    attributes: {
        'User-Name': String,
        // Note 1: Access-Request must contain either one
        'User-Password': String,
        'CHAP-Password': String,
        'State': String,
        // Note 2: Access-Request must contain either one
        'NAS-IP-Address': String,
        'NAS-Identifier': String,
        // End of Note 2
        'NAS-Port': String,
        'Service-Type': String,
        'Framed-Protocol': String,
        'Framed-IP-Address': String,
        'Framed-IP-Netmask': String,
        'Framed-Routing': String,
        'Filter-Id': String,
        'Framed-MTU': String,
        'Framed-Compression': String,
        'Login-IP-Host': String,
        'Login-Service': String,
        'Login-TCP-Port': String,
        'Reply-Message': String,
        'Callback-Number': String,
        'Callback-Id': String,
        'Framed-Route': String,
        'Framed-IPX-Network': String,
        'Class': String,
        'Vendor-Specific': String,
        'Session-Timeout': String,
        'Idle-Timeout': String,
        'Termination-Action': String,
        'Called-Station-Id': String,
        'Calling-Station-Id': String,
        'Proxy-State': String,
        'Login-LAT-Service': String,
        'Login-LAT-Node': String,
        'Login-LAT-Group': String,
        'Framed-AppleTalk-Link': String,
        'Framed-AppleTalk-Network': String,
        'Framed-AppleTalk-Zone': String,
        'CHAP-Challenge': String,
        'NAS-Port-Type': String,
        'Port-Limit': String,
        'Login-LAT-Port': String
    }

}, {
    versionKey: false,
    collection: 'authentication',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('Authentication', authenticationSchema);