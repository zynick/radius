'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountingInsertSchema = new Schema({

    date: {
        type: Date,
        default: Date.now
    },
    attributes: Schema.Types.Mixed

}, {
    versionKey: false,
    collection: 'accounting',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('AccountingInsert', accountingInsertSchema);



// https://tools.ietf.org/html/rfc2866#page-23
const accountingSchema = new Schema({

    date: {
        type: Date,
        default: Date.now
    },
    attributes: {
        'User-Name': String,
        'NAS-IP-Address': String,
        'NAS-Identifier': String,
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
        'Acct-Status-Type': String,
        'Acct-Delay-Time': String,
        'Acct-Input-Octets': String,
        'Acct-Output-Octets': String,
        'Acct-Session-Id': String,
        'Acct-Authentic': String,
        'Acct-Session-Time': String,
        'Acct-Input-Packets': String,
        'Acct-Output-Packets': String,
        'Acct-Terminate-Cause': String,
        'Acct-Multi-Session-Id': String,
        'Acct-Link-Count': String,
        'NAS-Port-Type': String,
        'Port-Limit': String,
        'Login-LAT-Port': String
    }

}, {
    versionKey: false,
    collection: 'accounting',
    autoIndex: process.env.NODE_ENV !== 'production'
});

mongoose.model('Accounting', accountingSchema);