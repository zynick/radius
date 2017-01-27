'use strict';

/*
 * RADIUS Authentication
 * https://tools.ietf.org/html/rfc2865
 */

const async = require('async');
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
const NAS = mongoose.model('NAS');



/* Start Server */
server.on('listening', () => {
    const address = server.address();
    log(`listening on ${address.address}:${address.port}`);
});

const sendResponse = (packet, code, next) => {
    const res = radius.encode_response({ packet, code, secret });

    server.send(res, 0, res.length, rinfo.port, rinfo.address,
        (err, bytes) => {
            if (err) { next(err); }
            log(`packet ${packet.identifier} responded: ${code}`);
        });
};

const authorizeCHAP = (packet, username, chapPassword, next) => {
    const challenge = packet.attributes['CHAP-Challenge'];
    if (!challenge || challenge.length !== 16) {
        return next(new Error('Invalid CHAP-Challenge.'));
    }

    // first byte is chap-id from mikrotik
    if (chapPassword.length !== 17) {
        return next(new Error('Invalid CHAP-Password.'));
    }
    
    Users.findOne({ username },
        (err, user) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return sendResponse(packet, 'Access-Reject', next);
            }

            const chapIdBin = chapPassword.slice(0, 1).toString('binary');
            const challengeBin = challenge.toString('binary');
            const hashed = md5(chapIdBin + user.password + challengeBin);

            const chapPasswordHex = chapPassword.slice(1).toString('hex');

            const code = hashed === chapPasswordHex ? 'Access-Accept' : 'Access-Reject';
            sendResponse(packet, code, next);
        });
};

const authorizePassword = (packet, username, password, next) => {
    Users.findOne({ username, password },
        (err, user) => {
            if (err) {
                return next(err);
            }
            const code = user ? 'Access-Accept' : 'Access-Reject';
            sendResponse(packet, code, next);
        });
};

const authorizeState = (packet, username, state, next) => {
    // never comes here because 'State' rely on 'Termination-Action',
    // and server didn't implement 'Termination-Action' upon 'Access-Accept' response.
    // https://tools.ietf.org/html/rfc2865#section-5.24
    next(new Error(`Access-Request with State is not impemented.`));
};

const stackDecode = (rawPacket, next) => {
    try {
        const packet = radius.decode({ packet: rawPacket, secret });
        log(`packet: ${JSON.stringify(packet)}`);
        next(null, packet);
    } catch (error) {
        if (error instanceof InvalidSecretError) {
            log('drop invalid secret message');
        } else {
            next(err);
        }
    }
};

const stackValidateIdentifier = (packet, next) => {
    // TODO drop packet if packet identifier repeated
    next(null, packet);
};

const stackValidateRequest = (packet, next) => {
    if (packet.code === 'Access-Request') {
        next(null, packet);
    } else {
        log(`drop invalid packet code ${packet.code}`);
    }
};

const stackValidateMAC = (packet, next) => {
    const id = packet.attributes['Calling-Station-Id'];
    NAS.findOne(
        { id },
        (err, nas) => {
            if (err) {
                next(err);
            } else if (nas) {
                next(null, packet, nas);
            } else {
                log(`drop invalid packet Calling-Station-Id(MAC) ${mac}`);
            }
        });
};

const stackNASSettings = (packet, nas, next) => {
    const { guest, email } = nas.login;

    // TODO how does guest auth works? does guest needs go thru authServer?

    // TODO email auth - CHAP-Password / User-Password

    // TODO how does [social-media] auth works?

    next(null, packet);
};

const stackAuthorization = (packet, next) => {
    const {
        ['User-Name']: username,
        ['CHAP-Password']: chapPassword,
        ['User-Password']: password,
        ['State']: state
    } = packet.attributes;

    if (chapPassword) {
        authorizeCHAP(packet, username, chapPassword);
    } else if (password) {
        authorizePassword(packet, username, password);
    } else if (state) {
        authorizeState(packet, username, state);
    } else {
        // https://tools.ietf.org/html/rfc2865#section-4.1
        next(new Error(`An Access-Request MUST contain either a User-Password or a CHAP-Password or State.`));
    }
};

server.on('message', (rawPacket, rinfo) => {
    // rinfo sample { address: '127.0.0.1', family: 'IPv4', port: 54950, size: 78 }

    async.waterfall([
        stackDecode,
        stackValidateIdentifier,
        stackValidateRequest,
        stackValidateMAC,
        stackNASSettings,
        stackAuthorization
    ], (err) => {
        if (err) {
            logError(err);
        }
    });

});

server.on('error', (err) => {
    logError(err);
    server.close();
});

server.bind(1812);
