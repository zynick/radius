'use strict';

const router = require('express').Router();
const log = require('debug')('web:routes');
const isProd = process.env.NODE_ENV === 'production';
const { version } = require('../package.json');


if (isProd) {

    router.get('/', (req, res) => {
        res.json(`Radius API Server v${version}`);
    });

} else {
    // for development only. remove later

    router.all('/', (req, res) => {
        log('==========');
        // log(`KEYS: ${Object.keys(req)}`);
        log(`HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
        log(`QUERY: ${JSON.stringify(req.query, null, 2)}`);
        log(`COOKIES: ${JSON.stringify(req.cookies, null, 2)}`);
        log(`PARAMS: ${JSON.stringify(req.params, null, 2)}`);
        log(`BODY: ${JSON.stringify(req.body, null, 2)}`);

        // res.setHeader('Access-Control-Allow-Credentials', 'true');
        // res.setHeader('Access-Control-Allow-Origin', '*');

        res.json(`Radius API Server v${version}`);
    });

}


router.use('/api', require('./api'));


/* 404 & Error Handlers */
router.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

router.use((err, req, res, next) => {
    const { status = 500, message = 'Internal Server Error' } = err;
    const error = { status, message };
    // hide stacktrace in production, show otherwise
    if (!isProd) { error.stack = err.stack; }
    res
        .status(status)
        .json({ error });
});


module.exports = router;
