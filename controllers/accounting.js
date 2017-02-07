'use strict';

const async = require('async');
const debug = require('debug');
const mongoose = require('mongoose');
const radius = require('radius');

const log = debug('acct:server');
const logError = debug('acct:error');
const { AAA_SECRET_KEY } = require('../config.js');
const Accounting = mongoose.model('Accounting');
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
        // TODO TRACK ACCOUNTING JSON FROM MIKROTIK

        const { attributes } = packet;
        const acctStatusType = attributes['Acct-Status-Type'];
        // const acctSessionId = attributes['Acct-Session-Id'];

        switch (acctStatusType) {
            case 'Start':
            case 'Stop':
            case 'Interim-Update':
            case 'Accounting-On':
            case 'Accounting-Off':
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