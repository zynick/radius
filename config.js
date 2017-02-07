'use strict';

const {
    AAA_SECRET_KEY = 'mikrotiksecret',
    MONGO = 'localhost:27017/radius',
    NODE_ENV = 'development',
    WEB_API_TOKEN = 'uVJ6t7bvRSQa3qaNKLLfyGwtrdqce9RI',
    WEB_PORT = 3001
} = process.env;

module.exports = {
    AAA_SECRET_KEY,
    MONGO,
    NODE_ENV,
    WEB_API_TOKEN,
    WEB_PORT
};
