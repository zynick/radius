'use strict';

const {
  AD_HOST = 'manager-api-dev.tideanalytics.com',
  AD_KEY = 'DuS6YR9aCMJc0345mPNAkAIzaSyCChtVm4UlxD4',
  MONGO = 'localhost:27017/radius-dev',
  NODE_ENV = 'development',
  SECRET_KEY = 'FunnyTreeBlackDeceive1'
} = process.env;

module.exports = {
  AD_HOST,
  AD_KEY,
  MONGO,
  NODE_ENV,
  SECRET_KEY
};
