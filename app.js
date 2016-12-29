'use strict';

const dgram = require('dgram');
const radius = require('radius');

const GLOBAL_SECRET = 'KYjFQP3BYDXS85k4';

// RADIUS authentication messages
const server1812 = dgram.createSocket('udp4');
server1812.on('error', (err) => {
    console.log(`server1812 error:\n${err.stack}`);
    server1812.close();
});

server1812.on('message', (msg, rinfo) => {
    console.log(`server1812 got: ${msg} from ${rinfo.address}:${rinfo.port}`);

    const decoded = radius.decode({ packet: msg, secret: GLOBAL_SECRET });
    console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`);
});

server1812.on('listening', () => {
    var address = server1812.address();
    console.log(`server1812 listening ${address.address}:${address.port}`);
});

server1812.bind(1812);


// RADIUS accounting messages
const server1813 = dgram.createSocket('udp4');
server1813.on('error', (err) => {
    console.log(`server1813 error:\n${err.stack}`);
    server1813.close();
});

server1813.on('message', (msg, rinfo) => {
    console.log(`server1813 got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server1813.on('listening', () => {
    var address = server1813.address();
    console.log(`server1813 listening ${address.address}:${address.port}`);
});

server1813.bind(1813);



console.log('hi');
