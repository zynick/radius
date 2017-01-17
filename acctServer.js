'use strict';

/*
 * RADIUS Accounting
 * https://tools.ietf.org/html/rfc2866
 */

const debug = require('debug');
const dgram = require('dgram');
const glob = require('glob');
const mongoose = require('mongoose');
const radius = require('radius');

const AccountingInsert = mongoose.model('AccountingInsert');
const InvalidSecretError = radius.InvalidSecretError;
const log = debug('acctServer');
const logError = debug('error');
const { mongo, secret } = require('./config.json');
const server = dgram.createSocket('udp4');

/* initialize database */
mongoose.connect(`mongodb://${mongo.host}:${mongo.port}/${mongo.database}`);
mongoose.connection.on('error', (err) => {
    logError(`unable to connect to database at ${mongo.host}:${mongo.port}/${mongo.database}`);
    logError(err);
});

const models = glob.sync('./models/*.js');
models.forEach((model) => {
    require(model);
});


/* start server */
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

    log(`packet: ${JSON.stringify(packet)}`);

    // TODO need to process to drop duplicate identifier
    // TODO need to process to drop duplicate identifier
    // TODO need to process to drop duplicate identifier

    const attributes = packet.attributes;
    const acctStatusType = attributes['Acct-Status-Type'];
    const acctSessionId = attributes['Acct-Session-Id'];

    function sendResponse(code) {
        const response = radius.encode_response({ packet, code, secret });

        server.send(response, 0, response.length, rinfo.port, rinfo.address, (err, bytes) => {
            if (err) {
                logError(err);
            }
            log(`packet ${packet.identifier} responded`);
        });
    }

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
                sendResponse('Accounting-Response');
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
