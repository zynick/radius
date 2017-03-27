'use strict';

const router = require('express').Router();
const { NODE_ENV } = require('../config.js');
const controller = require('../controllers/index.js');


if (NODE_ENV !== 'production') {
  router.use(controller.debug);
}

router.get('/', controller.index);
router.use('/api', require('./api'));
router.use(controller.notFound);
router.use(controller.errorHandlerJSON);


module.exports = router;
