'use strict';

const router = require('express').Router();
const log = require('debug')('web:routes');
const isProd = process.env.NODE_ENV === 'production';
const { version } = require('../package.json');


function routeMain(req, res) {
    res.json(`Radius API Server v${version}`);
}

function routeMainDebug(req, res) {
    log('==========');
    log(`HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
    log(`QUERY: ${JSON.stringify(req.query, null, 2)}`);
    log(`COOKIES: ${JSON.stringify(req.cookies, null, 2)}`);
    log(`PARAMS: ${JSON.stringify(req.params, null, 2)}`);
    log(`BODY: ${JSON.stringify(req.body, null, 2)}`);
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
    // res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(`Radius API Server v${version}`);
}

function routeNotFound(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
}

function routeErrorHandlerJSON(err, req, res, next) {
    const { status = 500, message = 'Internal Server Error' } = err;
    const error = { status, message };
    // hide stacktrace in production, show otherwise
    if (!isProd) { error.stack = err.stack; }
    res
        .status(status)
        .json({ error });
}



if (isProd) {
    router.get('/', routeMain);
} else {
    router.all('/', routeMainDebug);
}
router.use('/api', require('./api'));
router.use(routeNotFound);             // TODO change make routeBadRequest?
router.use(routeErrorHandlerJSON);


module.exports = router;
