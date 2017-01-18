'use strict';

const router = require('express').Router();
const isProd = process.env.NODE_ENV === 'production';
const { version } = require('../package.json');


router.all('/', (req, res) => {

    if (!isProd) {
        console.log('\n');
        // console.log(`KEYS: ${Object.keys(req)}`);
        console.log(`HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
        console.log(`QUERY: ${JSON.stringify(req.query, null, 2)}`);
        console.log(`COOKIES: ${JSON.stringify(req.cookies, null, 2)}`);
        console.log(`PARAMS: ${JSON.stringify(req.params, null, 2)}`);
        console.log(`BODY: ${JSON.stringify(req.body, null, 2)}`);

        // for development only. remove later
        // res.setHeader('Access-Control-Allow-Credentials', 'true');
        // res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.json(`Radius API Server v${version}`);
});


/* 404 & Error Handlers */
router.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

router.use((err, req, res, next) => {
    let result = {
        status: err.status || 500,
        message: err.message || 'Internal Server Error',
    };
    // hide stacktrace in production, show otherwise
    if (!isProd) {
        result.stack = err.stack;
    }
    res
        .status(result.status)
        .json({
            error: result
        });
});


module.exports = router;
