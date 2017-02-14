'use strict';

const NAS = require('mongoose').model('NAS');
const { WEB_API_TOKEN } = require('../config.js');


const tokenValidation = (req, res, next) => {

    if (req.headers.authorization !== `Bearer ${WEB_API_TOKEN}`) {
        const err = new Error('Unauthorized');
        err.status = 401;
        return next(err);
    }

    next();
};

const idValidation = (req, res, next) => {

    const id = req.query.id || req.body.id;

    if (!id) {
        const err = new Error('"id" parameter does not exist');
        err.status = 400;
        return next(err);
    }

    next();
};

const postNAS = (req, res, next) => {

    const { body, body: { id } } = req;

    NAS
        .findOneAndUpdate(
            { id },
            body,
            { upsert: true }
        )
        .maxTime(10000)
        .exec()
        .then(doc => res.status(200).end())
        .catch(next);
};


const getNASStatus = (req, res, next) => {

    const { id } = req.query;

    NAS
        .findOne({ id })
        .maxTime(10000)
        .exec()
        .then(nas => {
            if (!nas) {
                const err = new Error('NAS does not exist.');
                err.status = 400;
                return next(err);
            }

            const lastseen = nas.lastseen ? nas.lastseen.getTime() : -1;
            res.status(200).json({ lastseen });
        })
        .catch(next);
};


module.exports = {
    tokenValidation,
    idValidation,
    postNAS,
    getNASStatus,
};
