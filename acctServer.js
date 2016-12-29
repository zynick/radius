'use strict';

const debug = require('debug');
const dgram = require('dgram');
const log = debug('acctServer');
const logError = debug('error');
const server = dgram.createSocket('udp4');


server.on('listening', () => {
    const address = server.address();
    log(`listening @ ${address.address}:${address.port}`);
});

server.on('message', (msg, rinfo) => {
    log(`msg: ${msg}, rinfo: ${rinfo}`);
});

server.on('error', (err) => {
    logError(err);
    server.close();
});

server.bind(1813);


module.exports = server;
