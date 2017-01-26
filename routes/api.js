'use strict';

const mongoose = require('mongoose');
const router = require('express').Router();
const log = require('debug')('web:routes');
const NAS = mongoose.model('NAS');
const { apiToken } = require('../config.json');
const isProd = process.env.NODE_ENV === 'production';


function routeTokenValidation(req, res, next) {
    const { authorization } = req.headers;
    if (authorization !== `Bearer ${apiToken}`) {
        const err = new Error('Unauthorized');
        err.status = 401;
        return next(err);
    }
    next();
}

function routeAPRegister(req, res, next) {
    const { name, company, mac, secret } = req.body;

    if (!name || !company || !mac || !secret) {
        const err = new Error('"name|company|mac|secret" parameter does not exist');
        err.status = 400;
        return next(err);
    }

    NAS.findOne({ name, company }, (err, nas) => {
        if (err) {
            return next(err);
        }

        if (nas) {
            nas.mac = mac;
            nas.secret = secret;
        } else {
            nas = new NAS({ name, company, mac, secret });
        }

        nas.save((err) => {
            if (err) {
                return next(err);
            }

            res.status(200).end();
        });
    });

}

function routeAPStatus(req, res, next) {
    const { name, company } = req.query;

    NAS.findOne({ name, company }, (err, nas) => {
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
}



router.use(routeTokenValidation);
router.post('/ap/register', routeAPRegister);
router.get('/ap/status', routeAPStatus);


module.exports = router;
