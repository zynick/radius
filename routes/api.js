'use strict';

const router = require('express').Router();
const api = require('../controllers/api.js');
const controller = require('../controllers/index.js');

router.use(api.tokenValidation);

router.post('/nas',
  api.idValidation,
  api.postNAS);

router.get('/nas/status',
  api.idValidation,
  api.getNASStatus);

router.use(controller.badRequest);

module.exports = router;
