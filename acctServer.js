'use strict';

const debug = require('debug');
const dgram = require('dgram');
const radius = require('radius');

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
    // log(`message: ${message}, rinfo: ${rinfo}`);
    log(`rinfo: ${JSON.stringify(rinfo)}`);

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

});

server.on('error', (err) => {
    logError(err);
    server.close();
});

server.bind(1813);


module.exports = server;