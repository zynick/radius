'use strict';

const {
    SECRET_KEY = 'mikrotiksecret',
    API_TOKEN  = 'uVJ6t7bvRSQa3qaNKLLfyGwtrdqce9RI',
    MONGO_HOST = 'localhost',
    MONGO_PORT = 27017,
    MONGO_DATABASE = 'radius',
    NODE_ENV = 'development',
    PORT = 3000
} = process.env;

module.exports = {
    API_TOKEN,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DATABASE,
    NODE_ENV,
    PORT,
    SECRET_KEY, // we will have a global secret key for now
};