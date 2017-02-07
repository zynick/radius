'use strict';

const {
    AAA_SECRET_KEY = 'mikrotiksecret',
    MONGO_USER = 'radius-user',
    MONGO_PASS = 'radius-punya-password',
    MONGO_HOST = 'localhost',
    MONGO_PORT = 27017,
    MONGO_DB = 'radius',
    NODE_ENV = 'development',
    WEB_API_TOKEN = 'uVJ6t7bvRSQa3qaNKLLfyGwtrdqce9RI',
    WEB_PORT = 3001
} = process.env;

module.exports = {
    AAA_SECRET_KEY,
    MONGO_USER,
    MONGO_PASS,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DB,
    NODE_ENV,
    WEB_API_TOKEN,
    WEB_PORT
};
