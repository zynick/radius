'use strict';

// TODO separate accounting server from authentication server. it's just a logging server!

/*
 * RADIUS Accounting
 * https://tools.ietf.org/html/rfc2866
 */

const debug = require('debug');
const dgram = require('dgram');
const mongoose = require('mongoose');
const radius = require('radius');

const Accounting = mongoose.model('accounting');
const InvalidSecretError = radius.InvalidSecretError;
const log = debug('acctServer');
const logError = debug('error');
const secret = require('./config.json').secret;
const server = dgram.createSocket('udp4');

server.on('listening', () => {
    const address = server.address();
    log(`listening @ ${address.address}:${address.port}`);
});

server.on('message', (message, rinfo) => {
    // rinfo sample { address: '127.0.0.1', family: 'IPv4', port: 54950, size: 78 }

    let packet;
    try {
        packet = radius.decode({
            packet: message,
            secret
        });
    } catch (error) {
        if (error instanceof InvalidSecretError) {
            return log('drop invalid packet');
        } else {
            throw error;
        }
    }

    if (packet.code !== 'Accounting-Request') {
        return log(`drop invalid code packet ${packet.code}`);
    }

    // todo need to process to drop duplicate identifier
    // todo need to process to drop duplicate identifier
    // todo need to process to drop duplicate identifier
    // todo need to process to drop duplicate identifier
    // todo need to process to drop duplicate identifier
    // todo need to process to drop duplicate identifier

    const attributes = packet.attributes;
    const acctStatusType = attributes['Acct-Status-Type'];
    const acctSessionId = attributes['Acct-Session-Id'];

    log(`packet: ${JSON.stringify(packet)}`);

    switch (acctStatusType) {
        case 'Start':
            const acct = new Accounting({
                date: Date.now(), // TODO overwrite from attributes "Event-Timestamp" exist
                attributes: packet.attributes
            });
            acct.save((err, acct) => {
                if (err) {
                    logError(err);
                }
                log('packet logged successfully.');
            });
            // logError(new Error(`Acct-Status-Type ${acctStatusType} is not implemented.`));
            break;

        case 'Stop':
            logError(new Error(`Acct-Status-Type ${acctStatusType} is not implemented.`));
            break;

        case 'Interim-Update':
        case 'Accounting-On':
        case 'Accounting-Off':
            logError(new Error(`Acct-Status-Type ${acctStatusType} is not implemented.`));
            break;

        default:
            log(`drop invalid Acct-Status-Type packet ${acctStatusType}`);
            break;
    }

});

server.on('error', (err) => {
    logError(err);
    server.close();
});

server.bind(1813);


module.exports = server;