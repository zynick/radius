// Example radius client sending auth packets.

const radius = require('radius');
const dgram = require('dgram');
const util = require('util');

const secret = 'KYjFQP3BYDXS85k4';
const IP = '192.168.0.131';

const packet_accepted = {
    code: 'Access-Request',
    secret: secret,
    identifier: 0,
    attributes: [
        ['NAS-IP-Address', IP],
        ['User-Name', 'authUser'],
        ['User-Password', 'authPassword']
    ]
};

const packet_rejected = {
    code: 'Access-Request',
    secret: secret,
    identifier: 1,
    attributes: [
        ['NAS-IP-Address', IP],
        ['User-Name', 'egarak'],
        ['User-Password', 'tailoredfit']
    ]
};

const packet_wrong_secret = {
    code: 'Access-Request',
    secret: 'wrong_secret',
    identifier: 2,
    attributes: [
        ['NAS-IP-Address', IP],
        ['User-Name', 'riker'],
        ['User-Password', 'Riker-Omega-3']
    ]
};

const client = dgram.createSocket('udp4');

client.bind(49001);

let response_count = 0;

client.on('message', (msg, rinfo) => {
    const response = radius.decode({
        packet: msg,
        secret: secret
    });
    const request = sent_packets[response.identifier];

    // although it's a slight hassle to keep track of packets, it's a good idea to verify
    // responses to make sure you are talking to a server with the same shared secret
    const valid_response = radius.verify_response({
        response: msg,
        request: request.raw_packet,
        secret: request.secret
    });
    if (valid_response) {
        console.log('Got valid response ' + response.code + ' for packet id ' + response.identifier);
        // take some action based on response.code
    } else {
        console.log('WARNING: Got invalid response ' + response.code + ' for packet id ' + response.identifier);
        // don't take action since server cannot be trusted (but maybe alert user that shared secret may be incorrect)
    }

    if (++response_count == 3) {
        client.close();
    }
});

const sent_packets = {};

[packet_accepted, packet_rejected, packet_wrong_secret].forEach((packet) => {
    const encoded = radius.encode(packet);
    sent_packets[packet.identifier] = {
        raw_packet: encoded,
        secret: packet.secret
    };
    client.send(encoded, 0, encoded.length, 1812, 'localhost');
});
