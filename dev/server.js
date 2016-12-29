const radius = require('radius');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const secret = 'KYjFQP3BYDXS85k4';

server.on('message', (msg, rinfo) => {
    let code, username, password, packet;
    packet = radius.decode({
        packet: msg,
        secret: secret
    });

    if (packet.code != 'Access-Request') {
        console.log('unknown packet type: ', packet.code);
        return;
    }

    username = packet.attributes['User-Name'];
    password = packet.attributes['User-Password'];

    console.log('Access-Request for ' + username);

    if (username === 'authUser' && password === 'authPassword') {
        code = 'Access-Accept';
    } else {
        code = 'Access-Reject';
    }

    const response = radius.encode_response({
        packet,
        code,
        secret
    });

    console.log('Sending ' + code + ' for user ' + username);
    server.send(response, 0, response.length, rinfo.port, rinfo.address, (err, bytes) => {
        if (err) {
            console.log('Error sending response to ', rinfo);
        }
    });
});

server.on('listening', () => {
    const address = server.address();
    console.log('radius server listening ' + address.address + ':' + address.port);
});

server.bind(1812);
