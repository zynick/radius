'use strict';

const async = require('async');
const debug = require('debug');
const mongoose = require('mongoose');
const radius = require('radius');

const log = debug('acct:server');
const logError = debug('acct:error');
const admanager = require('../lib/admanager.js');
const { AAA_SECRET_KEY } = require('../config.js');
const Accounting = mongoose.model('Accounting');
const NAS = mongoose.model('NAS');
const { InvalidSecretError } = radius;


module.exports = server => {

    const sendResponse = (packet, { port, address }, code, next) => {
        const res = radius.encode_response({ packet, code, secret: AAA_SECRET_KEY });

        server.send(res, 0, res.length, port, address,
            (err, bytes) => {
                if (err) { next(err); }
                log(`packet ${packet.identifier} responded: ${code}`);
            });
    };

    const logAccounting = (attributes, packet, rinfo, next) => {
        new Accounting({
                // attributes['Event-Timestamp'] is add-on attribute from coova-chilli,
                // so we will not going to bother overwriting it to date
                date: Date.now(),
                attributes
            })
            .save()
            .then(acct => {
                log('packet logged successfully.');
                sendResponse(packet, rinfo, 'Accounting-Response', next);
            })
            .catch(next);
    };

    const stackDecodePacket = (rawPacket, rinfo, next) => {
        try {
            const packet = radius.decode({ packet: rawPacket, secret: AAA_SECRET_KEY });
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

    const stackValidateAcctRequest = (packet, rinfo, next) => {
        if (packet.code === 'Accounting-Request') {
            next(null, packet, rinfo);
        } else {
            log(`drop invalid code packet ${packet.code}`);
        }
    };

    const stackAccounting = (packet, rinfo, next) => {

        const { attributes } = packet;
        const acctStatusType = attributes['Acct-Status-Type'];
        // const acctSessionId = attributes['Acct-Session-Id'];

        switch (acctStatusType) {
            case 'Start':
            case 'Stop':
            case 'Interim-Update':
            case 'Accounting-On':
            case 'Accounting-Off':

                async.waterfall([
                    next => next(null, attributes, packet, rinfo),
                    (attributes, packet, rinfo, next) => {
                        const id = attributes['NAS-Identifier'];
                        NAS
                            .findOne({ id })
                            .maxTime(10000)
                            .exec()
                            .then(nas => {
                                if (!nas) {
                                    // TODO what are you going to do with this?
                                    return log(`drop invalid packet NAS-Identifier (MAC): ${id}`);
                                }
                                next(null, attributes, packet, rinfo, nas);
                            })
                            .catch(next);
                    },
                    (attributes, packet, rinfo, nas, next) => {
                        const { organization, id: nas_id } = nas;
                        const mac = attributes['Calling-Station-Id'];
                        const id = attributes['User-Name'];
                        const action = attributes['Acct-Status-Type']; // Start / Stop / Interim-Update
                        const payload = { type: 'Radius', action, attributes };
                        admanager.action(organization, nas_id, mac, id, payload, 
                            (err, httpRes) => next(err, attributes, packet, rinfo, httpRes));
                    },
                    (attributes, packet, rinfo, httpRes, next) => {
                        if (httpRes.statusCode !== 200) {
                            const err = new Error(`Unable to query content from AD Server: ${httpRes.statusMessage}`);
                            err.status = httpRes.statusCode;
                            return next(err);
                        }

                        log(`AD Server HTTP Response Body: ${JSON.stringify(httpRes.body)}`);
                        next(null, attributes, packet, rinfo);
                    },
                    (attributes, packet, rinfo, next) => {
                        logAccounting(attributes, packet, rinfo, next);
                    }
                ],
                err => {
                    if (err) { logError(err); }
                });
                break;

            default:
                log(`drop invalid Acct-Status-Type packet ${acctStatusType}`);
                next();
                break;
        }

    };

    const processAccounting = (rawPacket, rinfo) => {
        // rinfo sample { address: '127.0.0.1', family: 'IPv4', port: 54950, size: 78 }

        async.waterfall([
            next => next(null, rawPacket, rinfo),
            stackDecodePacket,
            stackValidateIdentifier,
            stackValidateAcctRequest,
            stackAccounting
        ], err => {
            if (err) { logError(err); }
        });
    };

    return processAccounting;
};