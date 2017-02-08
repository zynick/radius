'use strict';

const http = require('http');
const querystring = require('querystring');
const { AD_HOST, AD_KEY } = require('../config.js');

const action = (organization, nas_id, mac, id, payload, next) => {

    const postData = querystring.stringify({
        organization,
        nas_id,
        mac,
        id,
        payload
    });

    const options = {
        host: AD_HOST,
        path: '/action',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AD_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http
        .request(options, (res) => {
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
        .on('socket', (socket) => {
            socket
                .setTimeout(30 * 1000) // 30 seconds;
                .on('timeout', () => {
                    const err = new Error(`API timeout: ${AD_HOST}/action`);
                    err.status = 504;
                    next(err);
                });
        });

    req.write(postData);
    req.end();
};

module.exports = {
    action
};
