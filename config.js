'use strict';

const {
  AAA_SECRET_KEY = 'FunnyTreeBlackDeceive1',
  AD_HOST = 'manager-api-dev.tideanalytics.com',
  AD_KEY = 'DuS6YR9aCMJc0345mPNAkAIzaSyCChtVm4UlxD4',
  API_TOKEN = 'uVJ6t7bvRSQa3qaNKLLfyGwtrdqce9RI',
  API_PORT = 3000,
  MONGO = 'localhost:27017/radius',
  NODE_ENV = 'development'
} = process.env;

module.exports = {
  AAA_SECRET_KEY,
  AD_HOST,
  AD_KEY,
  API_TOKEN,
  API_PORT,
  MONGO,
  NODE_ENV
};
