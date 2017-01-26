'use strict';

const mongoose = require('mongoose');
const router = require('express').Router();
const NAS = mongoose.model('NAS');
const { apiToken } = require('../config.json');


const routeTokenValidation = (req, res, next) => {
    const { authorization } = req.headers;
    if (authorization !== `Bearer ${apiToken}`) {
        const err = new Error('Unauthorized');
        err.status = 401;
        return next(err);
    }
    next();
};

const routeAPRegister = (req, res, next) => {
    const { id } = req.body;

    if (!id) {
        const err = new Error('"id" parameter does not exist');
        err.status = 400;
        return next(err);
    }

    NAS.findOneAndUpdate(
        { id },
        req.body,
        { upsert: true },
        (err, doc) => {
            if (err) { return next(err); }
            res.status(200).end();
        });
};

const routeAPStatus = (req, res, next) => {
    const { id } = req.query;

    if (!id) {
        const err = new Error('"id" parameter does not exist');
        err.status = 400;
        return next(err);
    }

    NAS.findOne({ id }, (err, nas) => {
        if (err) {
            return next(err);
        }
        if (!nas) {
            const err = new Error('Not found');
            err.status = 404;
            return next(err);
        }

        const lastseen = nas.lastseen ? nast.lastseen.getTime() : -1;
        res.status(200).json({ lastseen });
    });
};



router.use(routeTokenValidation);
router.post('/ap/register', routeAPRegister);
router.get('/ap/status', routeAPStatus);


module.exports = router;
