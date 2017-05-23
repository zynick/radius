'use strict';

const async = require('async');
const debug = require('debug');
const md5 = require('md5');
const mongoose = require('mongoose');
const radius = require('radius');
const util = require('util');

const log = debug('authorization');
const logError = debug('authorization:error');
const { SECRET_KEY } = require('../config.js');
const Tokens = mongoose.model('Tokens');
const NAS = mongoose.model('NAS');


// referenced from https://github.com/retailnext/node-radius/blob/master/lib/radius.js#L31
const RejectError = function(message = '', packet = {}, constr = this) {
  this.message = message;
  this.packet = packet;
  Error.captureStackTrace(this, constr);
};
util.inherits(RejectError, Error);
RejectError.prototype.name = 'Radius Reject Error';


module.exports = server => {

  // TODO merge this function with the same function in accounting.js
  const _sendResponse = (packet, rinfo, code, attributes, next) => {
    // rinfo sample { address: '127.0.0.1', family: 'IPv4', port: 54950, size: 78 }

    const { port, address } = rinfo;

    /* jshint camelcase:false */
    const res = radius.encode_response({ packet, code, attributes, secret: SECRET_KEY });

    server.send(res, 0, res.length, port, address,
      (err, bytes) => { /* jshint unused: false */
        if (err) { next(err); }
        log(`packet ${packet.identifier} responded: ${code}, ${JSON.stringify(attributes)}`);
      });
  };

  const authorizeCHAP = (packet, rinfo, nas, username, chapPassword, next) => {

    const challenge = packet.attributes['CHAP-Challenge'];
    if (!challenge || challenge.length !== 16) {
      return next(new RejectError('Invalid CHAP-Challenge.', packet));
    }

    // first byte is chap-id from mikrotik
    if (chapPassword.length !== 17) {
      return next(new RejectError('Invalid CHAP-Password Length.', packet));
    }

    Tokens
      .findOne({ organization: nas.organization, mac: username })
      .maxTime(10000)
      .exec()
      .then(token => {
        if (!token) {
          return next(new RejectError('Invalid CHAP-Password.', packet));
        }

        const chapIdBin = chapPassword.slice(0, 1).toString('binary');
        const challengeBin = challenge.toString('binary');
        const dbChapHash = md5(chapIdBin + token.token + challengeBin);

        const inputChapHash = chapPassword.slice(1).toString('hex');

        if (dbChapHash !== inputChapHash) {
          return next(new RejectError('Invalid CHAP-Password.', packet));
        }

        // TODO refactor this
        Tokens
          .findOneAndRemove({ organization: nas.organization, mac: username })
          .maxTime(10000)
          .exec()
          .then(() => _sendResponse(packet, rinfo, 'Access-Accept', null, next))
          .catch(next);

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
          return next(new RejectError('Invalid Credentials.', packet));
        }

        // TODO refactor this
        Tokens
          .findOneAndRemove({ organization: nas.organization, mac: username })
          .maxTime(10000)
          .exec()
          .then(() => _sendResponse(packet, rinfo, 'Access-Accept', null, next))
          .catch(next);

      })
      .catch(next);
  };

  // TODO test with mikrotik and if possible, remove this stupid function
  const authorizeGuestToBeRemoved = (packet, rinfo, username, next) => {
    // verify mikrotik username format
    // TODO can we refactor this to be not brand/model specific?
    const code = (username.length === 19 && username.indexOf('T-') === 0) ?
      'Access-Accept' : 'Access-Reject';
    log(' ============== authorizeGuest(): DOES IT EVER REACH HERE BEFORE??? ================ ');
    _sendResponse(packet, rinfo, code, null, next);
  };

  const authorizeState = (packet, rinfo, state, next) => {
    // never comes here because 'State' rely on 'Termination-Action',
    // and server didn't implement 'Termination-Action' upon 'Access-Accept' response.
    // https://tools.ietf.org/html/rfc2865#section-5.24
    next(new RejectError('Server does not accept and process State attribute.', packet));
  };

  const stackDecodePacket = (rawPacket, rinfo, next) => {
    let packet;

    try {
      packet = radius.decode({ packet: rawPacket, secret: SECRET_KEY });
    } catch (err) {
      return next(err);
    }

    log(`packet: ${JSON.stringify(packet)}`);
    next(null, packet, rinfo);
  };

  const stackValidatePacketCode = (packet, rinfo, next) => {
    if (packet.code === 'Access-Request') {
      next(null, packet, rinfo);
    } else {
      // https://tools.ietf.org/html/rfc2865#page-14
      log(`discard invalid packet code: ${packet.code}`);
    }
  };

  const stackValidateNASIdentifier = (packet, rinfo, next) => {
    const id = packet.attributes['NAS-Identifier'];

    if (!id) {
      return next(new RejectError('NAS-Identifier is required.', packet));
    }

    NAS
      .findOne({ id })
      .maxTime(10000)
      .exec()
      .then(nas => {
        if (!nas) {
          return next(new RejectError(`Invalid NAS-Identifier: ${id}`, packet));
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

  const stackValidateUserName = (packet, rinfo, nas, next) => {
    const username = packet.attributes['User-Name'];

    if (!username) {
      return next(new RejectError('User-Name is required.', packet));
    }

    next(null, packet, rinfo, nas);
  };

  const stackAuthorization = (packet, rinfo, nas, next) => {
    const {
      'User-Name': username,
      'CHAP-Password': chapPassword,
      'User-Password': password,
      'State': state
    } = packet.attributes;

    if (chapPassword) {
      authorizeCHAP(packet, rinfo, nas, username, chapPassword, next);
    } else if (password) {
      authorizePassword(packet, rinfo, nas, username, password, next);
    } else if (password === '') {
      authorizeGuestToBeRemoved(packet, rinfo, username, next);
    } else if (state) {
      authorizeState(packet, rinfo, state, next);
    } else {
      // https://tools.ietf.org/html/rfc2865#section-4.1
      const message = 'An Access-Request MUST contain either ' +
          'User-Password, CHAP-Password or State.';
      next(new RejectError(message, packet));
    }
  };

  const processAuthorization = (rawPacket, rinfo) => {
    // rinfo sample { address: '127.0.0.1', family: 'IPv4', port: 54950, size: 78 }

    log(`*****************************************************************`);

    async.waterfall([
      next => next(null, rawPacket, rinfo),
      stackDecodePacket,
      stackValidatePacketCode,
      stackValidateNASIdentifier,
      stackNASLastSeen,
      stackValidateUserName,
      stackAuthorization
    ], err => {
      if (err instanceof RejectError) {
        const attributes = { 'Reply-Message': err.message };
        _sendResponse(err.packet, rinfo, 'Access-Reject', attributes,
          _err => { if (_err) { logError(_err); } });
      } else if (err) {
        logError(err);
      }
    });
  };

  return processAuthorization;
};
