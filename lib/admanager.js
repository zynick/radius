'use strict';

const https = require('https');
const log = require('debug')('admanager');
const { AD_HOST, AD_KEY } = require('../config.js');


const _post = (path = '/', json = {}, next = () => {}) => {

  const _nextErrWrapper = err => {
    const _err = new Error(`[admanager] ${err.message}`);
    _err.status = err.status || 500;
    next(_err);
  };

  const jsonString = JSON.stringify(json);

  const options = {
    host: AD_HOST,
    path,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AD_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(jsonString)
    }
  };

  const req = https
    .request(options, res => {
      let data = '';
      res
        .setEncoding('utf8')
        .on('data', d => data += d)
        .on('end', () => {
          try {
            res.body = JSON.parse(data);
          } catch (e) {
            res.body = data;
          }
          log(`admanager response: ${res.statusCode}`);
          log(JSON.stringify(data, null, 2));
          next(null, res);
        })
        .on('error', _nextErrWrapper);
    })
    .on('error', _nextErrWrapper)
    .on('socket', socket => {
      socket
        .setTimeout(10 * 1000)
        .on('timeout', () => {
          const err = new Error(`API timeout: ${AD_HOST}${path}`);
          err.status = 504;
          _nextErrWrapper(err);
        });
    });

  req.write(jsonString);
  req.end();
};

const action = (organization, nas_id, mac, id, action, payload, next) => {
  const json = { organization, nas_id, mac, id, action, payload };
  _post('/action', json, next);
};

const asset = (organization, nas_id, mac, id, next) => {
  const json = { organization, nas_id, mac, id };
  _post('/asset', json, next);
};


module.exports = { action, asset };
