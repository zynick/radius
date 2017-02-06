'use strict';

const argon2 = require('argon2');
const async = require('async');
const debug = require('debug');
const md5 = require('blueimp-md5');
const mongoose = require('mongoose');
const radius = require('radius');

const log = debug('auth:server');
const logError = debug('auth:error');
const { SECRET_KEY } = require('../config.js');
const Users = mongoose.model('Users');
const NAS = mongoose.model('NAS');
const { InvalidSecretError } = radius;


module.exports = server => {

    const sendResponse = (packet, { port, address }, code, next) => {
        const res = radius.encode_response({ packet, code, SECRET_KEY });

        server.send(res, 0, res.length, port, address,
            (err, bytes) => {
                if (err) { next(err); }
                log(`packet ${packet.identifier} responded: ${code}`);
            });
    };

    const hashPassword = (username, password, next) => {
        argon2
            .hash(password, new Buffer(username + 'ace-tide'), {
                type: argon2.argon2d,
                timeCost: 3,
                memoryCost: 11,
                parallelism: 1,
                raw: true
            })
            .then(hash => next(null, hash.toString('hex')) )
            .catch(next);
    };

    const authorizeCHAP = (packet, rinfo, username, chapPassword, next) => {
        const challenge = packet.attributes['CHAP-Challenge'];
        if (!challenge || challenge.length !== 16) {
            return next(new Error('Invalid CHAP-Challenge.'));
        }

        // first byte is chap-id from mikrotik
        if (chapPassword.length !== 17) {
            return next(new Error('Invalid CHAP-Password.'));
        }

        Users
            .findOne({ username })
            .maxTime(10000)
            .exec()
            .then(user => {
                if (!user) {
                    return sendResponse(packet, rinfo, 'Access-Reject', next);
                }

                const chapIdBin = chapPassword.slice(0, 1).toString('binary');
                const challengeBin = challenge.toString('binary');
                const hashed = md5(chapIdBin + user.password + challengeBin);

                const chapPasswordHex = chapPassword.slice(1).toString('hex');

                const code = hashed === chapPasswordHex ? 'Access-Accept' : 'Access-Reject';
                sendResponse(packet, rinfo, code, next);
            })
            .catch(next);
    };

    const authorizePassword = (packet, rinfo, username, password, next) => {
        Users
            .findOne({ username, password })
            .maxTime(10000)
            .exec()
            .then(user => {
                const code = user ? 'Access-Accept' : 'Access-Reject';
                sendResponse(packet, rinfo, code, next);
            })
            .catch(next);
    };

    const authorizeState = (packet, rinfo, username, state, next) => {
        // never comes here because 'State' rely on 'Termination-Action',
        // and server didn't implement 'Termination-Action' upon 'Access-Accept' response.
        // https://tools.ietf.org/html/rfc2865#section-5.24
        next(new Error(`Access-Request with State is not impemented.`));
    };

    const authorizeGuest = (packet, rinfo, username, next) => {
        // verify mikrotik username format
        const code = (username.length === 19 && username.indexOf('T-') === 0) ? 'Access-Accept' : 'Access-Reject';
        sendResponse(packet, rinfo, code, next);
    };

    const stackDecodePacket = (rawPacket, rinfo, next) => {
        try {
            const packet = radius.decode({ packet: rawPacket, SECRET_KEY });
            log(`packet: ${JSON.stringify(packet)}`);
            next(null, packet, rinfo);
        } catch (err) {
            if (err instanceof InvalidSecretError) {
                log('drop invalid secret message');
            } else {
                next(err);
            }
        }
    };

    const stackValidateIdentifier = (packet, rinfo, next) => {
        // TODO drop packet if packet identifier repeated
        next(null, packet, rinfo);
    };

    const stackValidateAuthRequest = (packet, rinfo, next) => {
        if (packet.code === 'Access-Request') {
            next(null, packet, rinfo);
        } else {
            log(`drop invalid packet code ${packet.code}`);
        }
    };

    const stackValidateMAC = (packet, rinfo, next) => {
        const id = packet.attributes['NAS-Identifier'];
        NAS
            .findOne({ id })
            .maxTime(10000)
            .exec()
            .then(nas => {
                if (!nas) {
                    return log(`drop invalid packet NAS-Identifier (MAC): ${id}`);
                }
                next(null, packet, rinfo, nas);
            })
            .catch(next);
    };

    const stackNASSettings = (packet, rinfo, nas, next) => {
        const { guest, email } = nas.login;

        // TODO how does guest auth works? does guest needs go thru authServer?

        // TODO email auth - CHAP-Password / User-Password

        // TODO how does [social-media] auth works?

        next(null, packet, rinfo);
    };

    const stackAuthorization = (packet, rinfo, next) => {
        const {
            ['User-Name']: username,
            ['CHAP-Password']: chapPassword,
            ['User-Password']: password,
            ['State']: state
        } = packet.attributes;

        if (chapPassword) {
            authorizeCHAP(packet, rinfo, username, chapPassword, next);
        } else if (password) {
            authorizePassword(packet, rinfo, username, password, next);
        } else if (state) {
            authorizeState(packet, rinfo, username, state, next);
        } else if (password === '') {
            authorizeGuest(packet, rinfo, username, next);
        } else {
            // https://tools.ietf.org/html/rfc2865#section-4.1
            next(new Error(`An Access-Request MUST contain either a User-Password or a CHAP-Password or State.`));
        }
    };

    const processAuthorization = (rawPacket, rinfo) => {
        // rinfo sample { address: '127.0.0.1', family: 'IPv4', port: 54950, size: 78 }

        async.waterfall([
            next => next(null, rawPacket, rinfo),
            stackDecodePacket,
            stackValidateIdentifier,
            stackValidateAuthRequest,
            stackValidateMAC,
            stackNASSettings,
            stackAuthorization
        ], err => {
            if (err) { logError(err); }
        });
    };

    return processAuthorization;
};
