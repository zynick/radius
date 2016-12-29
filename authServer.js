'use strict';

const dgram = require('dgram');
const radius = require('radius');
const server = dgram.createSocket('udp4');
const InvalidSecretError = radius.InvalidSecretError;

module.exports = (secret) => {

    server.on('listening', () => {
        const {
            address,
            port
        } = server.address();

        console.log(`authentication server listening ${address}:${port}`);
    });

    server.on('message', (packet, rinfo) => {
        try {
            const message = radius.decode({
                packet,
                secret
            });

            console.log(`authentication server message: ${JSON.stringify(message, null, 2)}`);

        } catch (error) {
            if (error instanceof InvalidSecretError) {
                console.log('drop invalid packet');
            } else {
                throw error;
            }
        }
    });

    server.on('error', (err) => {
        console.log(`authentication server error:\n${err.stack}`);
        server.close();
    });

    server.bind(1812);

};
