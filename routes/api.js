'use strict';

const mongoose = require('mongoose');
const router = require('express').Router();
const NAS = mongoose.model('NAS');
const { WEB_API_TOKEN } = require('../config.js');


const routeTokenValidation = (req, res, next) => {
    const { authorization } = req.headers;
    if (authorization !== `Bearer ${WEB_API_TOKEN}`) {
        const err = new Error('Unauthorized');
        err.status = 401;
        return next(err);
    }
    next();
};

const routeNAS = (req, res, next) => {
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

const routeNASStatus = (req, res, next) => {
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

        const lastseen = nas.lastseen ? nas.lastseen.getTime() : -1;
        res.status(200).json({ lastseen });
    });
};



router.use(routeTokenValidation);
router.post('/nas', routeNAS);
router.get('/nas/status', routeNASStatus);


module.exports = router;
