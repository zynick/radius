'use strict';

const async = require('async');
const debug = require('debug');
const md5 = require('md5');
const mongoose = require('mongoose');
const radius = require('radius');

const log = debug('radius:authorization');
const logError = debug('radius:error');
const { AAA_SECRET_KEY } = require('../config.js');
// const Users = mongoose.model('Users');
const Tokens = mongoose.model('Tokens');
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

  const authorizeCHAP = (packet, rinfo, nas, username, chapPassword, next) => {

    const challenge = packet.attributes['CHAP-Challenge'];
    if (!challenge || challenge.length !== 16) {
      return next(new Error('Invalid CHAP-Challenge.'));
    }

    // first byte is chap-id from mikrotik
    if (chapPassword.length !== 17) {
      return next(new Error('Invalid CHAP-Password.'));
    }

    Tokens
      .findOne({ organization: nas.organization, mac: username })
      .maxTime(10000)
      .exec()
      .then(token => {
        if (!token) {
          return sendResponse(packet, rinfo, 'Access-Reject', next);
        }

        const chapIdBin = chapPassword.slice(0, 1).toString('binary');
        const challengeBin = challenge.toString('binary');
        const dbChapHash = md5(chapIdBin + token.token + challengeBin);

        const inputChapHash = chapPassword.slice(1).toString('hex');

const chapId = chapPassword.slice(0, 1);
log(`  chapId: ${chapId}, chapIdBin: ${chapIdBin}`);
log(`  chapChallenge: ${challenge}, chapChallengeBin: ${challengeBin}`);
log(`  token: ${token.token}, dbChapHash: ${dbChapHash}`);
log(`  inputChapHash: ${inputChapHash}, chapPassword: ${chapPassword}`);

        if (dbChapHash !== inputChapHash) {
          return sendResponse(packet, rinfo, 'Access-Reject', next);
        }

        // TODO refactor this
        Tokens
          .findOneAndRemove({ organization: nas.organization, mac: username })
          .maxTime(10000)
          .exec()
          .then(() => sendResponse(packet, rinfo, 'Access-Accept', next))
          .catch(next)

      })
      .catch(next);
  };

  const authorizePassword = (packet, rinfo, nas, username, password, next) => {
    Tokens
      .findOne({ organization: nas.organization, mac: username, token: password })
      .maxTime(10000)
      .exec()
      .then(token => {

        if (!token) {
          return sendResponse(packet, rinfo, 'Access-Reject', next);
        }

        // TODO refactor this
        Tokens
          .findOneAndRemove({ organization: nas.organization, mac: username })
          .maxTime(10000)
          .exec()
          .then(() => sendResponse(packet, rinfo, 'Access-Accept', next))
          .catch(next)

      })
      .catch(next);
  };

  const authorizeGuest = (packet, rinfo, username, next) => {
    // verify mikrotik username format
    const code = (username.length === 19 && username.indexOf('T-') === 0) ? 'Access-Accept' : 'Access-Reject';
    log(' ============== authorizeGuest(): DOES IT EVER REACH HERE BEFORE??? ================ ');
    sendResponse(packet, rinfo, code, next);
  };

  const authorizeState = (packet, rinfo, state, next) => {
    // never comes here because 'State' rely on 'Termination-Action',
    // and server didn't implement 'Termination-Action' upon 'Access-Accept' response.
    // https://tools.ietf.org/html/rfc2865#section-5.24
    next(new Error(`Access-Request with State is not impemented.`));
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

  const stackNASLastSeen = (packet, rinfo, nas, next) => {
    nas.lastseen = new Date();
    nas
      .save()
      .then(nas => next(null, packet, rinfo, nas))
      .catch(next);
  };

  const stackAuthorization = (packet, rinfo, nas, next) => {
    const {
      ['User-Name']: username, ['CHAP-Password']: chapPassword, ['User-Password']: password, ['State']: state
    } = packet.attributes;

    if (chapPassword) {
      authorizeCHAP(packet, rinfo, nas, username, chapPassword, next);
    } else if (password) {
      authorizePassword(packet, rinfo, nas, username, password, next);
    } else if (password === '') {
      authorizeGuest(packet, rinfo, username, next);
    } else if (state) {
      authorizeState(packet, rinfo, state, next);
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
      stackNASLastSeen,
      stackAuthorization
    ], err => {
      if (err) { logError(err); }
    });
  };

  return processAuthorization;
};
