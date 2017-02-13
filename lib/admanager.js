'use strict';

const http = require('http');
const { AD_HOST, AD_KEY } = require('../config.js');

const _post = (path = '/', json = {}, next = () => {}) => {

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

    const req = http
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
                    next(null, res);
                })
                .on('error', next);

        })
        .on('error', next)
        .on('socket', socket => {
            socket
                .setTimeout(30 * 1000) // 30 seconds;
                .on('timeout', () => {
                    const err = new Error(`API timeout: ${AD_HOST}${path}`);
                    err.status = 504;
                    next(err);
                });
        });

    req.write(jsonString);
    req.end();
};

const action = (organization, nas_id, mac, id, payload, next) => {
    const json = { organization, nas_id, mac, id, payload };
    _post('/action', json, next);
};

const asset = (organization, nas_id, mac, id, next) => {
    const json = { organization, nas_id, mac, id };
    _post('/asset', json, next);
};

module.exports = { action, asset };
