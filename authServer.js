'use strict';

/*
 * RADIUS Authentication
 * https://tools.ietf.org/html/rfc2865
 */

const debug = require('debug');
const dgram = require('dgram');
const glob = require('glob');
const mongoose = require('mongoose');
const radius = require('radius');

const Users = mongoose.model('Users');
const InvalidSecretError = radius.InvalidSecretError;
const log = debug('authServer');
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

    log(`packet: ${JSON.stringify(packet)}`);

    // TODO need to process to drop duplicate identifier
    // TODO need to process to drop duplicate identifier`
    // TODO need to process to drop duplicate identifier

    function sendResponse(code) {
        const response = radius.encode_response({ packet, code, secret });

        server.send(response, 0, response.length, rinfo.port, rinfo.address, (err, bytes) => {
            if (err) {
                logError(err);
            }
            log(`packet ${packet.identifier} responded`);
        });
    }

    switch (packet.code) {
        case 'Access-Request':
            const username = packet.attributes['User-Name'];
            const password = packet.attributes['User-Password'];

            // TODO FIXME cheapo way to store password (plain text). please store properly.
            Users.findOne({
                username,
                password
            }, (err, user) => {
                if (err) {
                    logError(err);
                }

                const code = user ? 'Access-Accept' : 'Access-Reject';
                sendResponse(code);
            });
            break;

        case 'Access-Challenge':
            logError(new Error(`Code ${packet.code} is not impemented.`));
            break;

        default:
            log(`drop invalid code packet ${packet.code}`);
            break;
    }

});

server.on('error', (err) => {
    logError(err);
    server.close();
});

server.bind(1812);
