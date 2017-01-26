'use strict';

/*
 * RADIUS Authentication
 * https://tools.ietf.org/html/rfc2865
 */

const md5 = require('blueimp-md5');
const debug = require('debug');
const dgram = require('dgram');
const glob = require('glob');
const mongoose = require('mongoose');
const radius = require('radius');

const { InvalidSecretError } = radius;
const log = debug('auth:server');
const logError = debug('auth:error');
const { mongo, secret } = require('./config.json');
const server = dgram.createSocket('udp4');


/* Initialize Database */
mongoose.connect(`mongodb://${mongo.host}:${mongo.port}/${mongo.database}`);
mongoose.connection.on('error', (err) => {
    logError(`unable to connect to database at ${mongo.host}:${mongo.port}/${mongo.database}`);
    logError(err);
});
glob.sync('./models/*.js')
    .forEach((model) => {
        require(model);
    });

const Users = mongoose.model('Users');


/* Start Server */
server.on('listening', () => {
    const address = server.address();
    log(`listening on ${address.address}:${address.port}`);
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
            return log('drop invalid secret message');
        } else {
            throw error;
        }
    }

    log(`packet: ${JSON.stringify(packet)}`);

    // TODO need to process to drop duplicate identifier
    // TODO need to process to drop duplicate identifier
    // TODO need to process to drop duplicate identifier

    function sendResponse(code) {
        const res = radius.encode_response({ packet, code, secret });

        server.send(res, 0, res.length, rinfo.port, rinfo.address,
            (err, bytes) => {
                if (err) {
                    logError(err);
                }
                log(`packet ${packet.identifier} responded: ${code}`);
            });
    }

    function requestPassword(username, password) {
        // TODO FIXME cheapo way to store password (plain text). please store properly.
        Users.findOne({ username, password },
            (err, user) => {
                if (err) {
                    return logError(err);
                }
                const code = user ? 'Access-Accept' : 'Access-Reject';
                return sendResponse(code);
            });
    }

    function requestCHAP(username, chapPassword) {
        const challenge = packet.attributes['CHAP-Challenge'];
        if (!challenge || challenge.length !== 16) {
            return logError(new Error('Invalid CHAP-Challenge.'));
        }

        // first byte is chap-id from mikrotik
        if (chapPassword.length !== 17) {
            return logError(new Error('Invalid CHAP-Password.'));
        }
        const _chapPassword = chapPassword.slice(1).toString('hex');

        Users.findOne({
            username
        }, (err, user) => {
            if (err) {
                return logError(err);
            }
            if (!user) {
                return sendResponse('Access-Reject');
            }

            const hashed = md5(user.password + challenge.toString('binary'));
            const code = hashed === _chapPassword ? 'Access-Accept' : 'Access-Reject';
            return sendResponse(code);
        });
    }

    function requestState(username, state) {
        return logError(new Error(`Access-Request with State is not impemented.`));
    }



    if (packet.code !== 'Access-Request') {
        return log(`drop invalid packet code ${packet.code}`);
    }

    const username = packet.attributes['User-Name'];
    // must have either one
    const password = packet.attributes['User-Password'];
    const chapPassword = packet.attributes['CHAP-Password'];
    const state = packet.attributes['State'];

    if (password) {
        requestPassword(username, password);

    } else if (chapPassword) {
        requestCHAP(username, chapPassword);

    } else if (state) {
        requestState(username, state);

    } else {
        // https://tools.ietf.org/html/rfc2865#section-4.1
        return logError(new Error(`An Access-Request MUST contain either a User-Password or a CHAP-Password or State.`));
    }

});

server.on('error', (err) => {
    logError(err);
    server.close();
});

server.bind(1812);
