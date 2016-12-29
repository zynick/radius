'use strict';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('listening', () => {
    const {
        address,
        port
    } = server.address();

    console.log(`accounting server listening ${address}:${port}`);
});

server.on('message', (msg, rinfo) => {

});

server.on('error', (err) => {
    console.log(`accounting server error:\n${err.stack}`);
    server.close();
});

server.bind(1813);

module.exports = server;
