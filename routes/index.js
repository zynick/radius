'use strict';

const router = require('express').Router();
const log = require('debug')('wapi:routes');
const { NODE_ENV } = require('../config.js');
const isProduction = NODE_ENV === 'production';
const { version } = require('../package.json');


const routeDebug = (req, res, next) => {
    log('==========');
    log(`HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
    log(`QUERY: ${JSON.stringify(req.query, null, 2)}`);
    log(`COOKIES: ${JSON.stringify(req.cookies, null, 2)}`);
    log(`PARAMS: ${JSON.stringify(req.params, null, 2)}`);
    log(`BODY: ${JSON.stringify(req.body, null, 2)}`);
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
    // res.setHeader('Access-Control-Allow-Origin', '*');
    next();
};

const routeNotFound = (req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
};

const routeErrorHandlerJSON = (err, req, res, next) => {
    const { status = 500, message = 'Internal Server Error' } = err;
    const error = { status, message };
    // hide stacktrace in production, show otherwise
    if (!isProduction) { error.stack = err.stack; }
    res
        .status(status)
        .json({ error });
};


if (!isProduction) {
    router.use(routeDebug);
}
router.get('/', (req, res) => res.json(`Radius API Server v${version}`));
router.use('/api', require('./api'));
router.use(routeNotFound);             // TODO change make routeBadRequest?
router.use(routeErrorHandlerJSON);


module.exports = router;
