'use strict';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const logger = require('morgan'); // TODO use morgan and use debug, confusing..
// const favicon = require('serve-favicon');
const path = require('path');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const routes = require('./routes/index');


/* View Engine Setup */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


/* Express Stack Setup */
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);


/* 404 & Error Handlers */
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    // only print stacktrace in development, hide in production
    err = isProd ? {} : err;
    res.render('error', {
        message: err.message,
        error: err
    });
});


module.exports = app;
