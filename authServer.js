'use strict';

/*
 * RADIUS Authentication server
 * https://tools.ietf.org/html/rfc2865
 */

const debug = require('debug');
const dgram = require('dgram');
const mongoose = require('mongoose');
const radius = require('radius');

const authentication = mongoose.model('authentication');
const InvalidSecretError = radius.InvalidSecretError;
const log = debug('authServer');
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

    log(`packet: ${JSON.stringify(packet)}`);

    switch (packet.code) {
        case 'Access-Request':
            const username = packet.attributes['User-Name'];
            const password = packet.attributes['User-Password'];

            // do verification here
            const code = 'Access-Accept'; // Access-Accept
            authentication.find({ username }, (err, results) => {
                console.log(err);
                console.log(results);
            });

            const response = radius.encode_response({
                packet,
                code,
                secret
            });


            server.send(response, 0, response.length, rinfo.port, rinfo.address, (err, bytes) => {
                if (err) {
                    logError(new Error(`Error sending response to ${rinfo}`));
                }
            });

            break;

        case 'Access-Accept':
            logError('Access-Accept not implemented yet.');
            break;

        case 'Access-Reject':
            logError('Access-Reject not implemented yet.');
            break;

        case 'Access-Challenge':
            logError('Access-Challenge not implemented yet.');
            break;
    }

});

server.on('error', (err) => {
    logError(err);
    server.close();
});

server.bind(1812);


module.exports = server;
