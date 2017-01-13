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

const AccountingInsert = mongoose.model('AccountingInsert');
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

    // TODO need to process to drop duplicate identifier

    const attributes = packet.attributes;
    const acctStatusType = attributes['Acct-Status-Type'];
    const acctSessionId = attributes['Acct-Session-Id'];

    log(`packet: ${JSON.stringify(packet)}`);

    var sendResponse = () => {
        const response = radius.encode_response({
            packet,
            code: 'Accounting-Response',
            secret
        });

        server.send(response, 0, response.length, rinfo.port, rinfo.address, (err, bytes) => {
            if (err) {
                logError(new Error(`Error sending response to ${rinfo}: ${err.message}`));
            }
            log(`packet ${packet.identifier} responded`);
        });
    };

    switch (acctStatusType) {
        case 'Start':
        case 'Stop':
        case 'Interim-Update':
        case 'Accounting-On':
        case 'Accounting-Off':
            const acct = new AccountingInsert({
                // attributes['Event-Timestamp'] is add-on attribute from coova-chilli,
                // so we will not going to bother overwriting it to date
                date: Date.now(),
                attributes
            });
            acct.save((err, acct) => {
                if (err) {
                    logError(err);
                }
                log('packet logged successfully.');
                sendResponse();
            });
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