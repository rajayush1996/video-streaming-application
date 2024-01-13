const _ = require('lodash');
const httpStatus = require('http-status');
const logger = require('./logger');

const mongoose = require('mongoose');
const config = require('../../config/config');
const {v4: uuidv4} = require('uuid');

class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.msg = message;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

function errorConverter(err, req, res, next) {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode
      = error.statusCode || (error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.FORBIDDEN);

        const message = error.message || httpStatus[statusCode];
        error = new ApiError(statusCode, message, false, err.stack);
    }

    if (error.message === 'ERR_TOKEN_EXPIRED') {
        return res.status(401).json({error: [{msg: 'invalid access token', code: 'TOKEN_EXPIRED'}], code: 'TOKEN_EXPIRED'});
    }

    next(error);
}

function errorHandler(err, req, res, next) {
    let {statusCode, message} = err;

    if (_.includes([], []) && !err.isOperational) {
        statusCode = httpStatus.FORBIDDEN;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }

    if (res.headersSent) {
        return next(err);
    }

    res.locals.errorMessage = err.message.trim();
    const isDevEnv = ['development', 'uat'].includes(config.env.environment);
    // eslint-disable-next-line no-control-regex
    const sanitizedMessage = message.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]/g, ' ');
    const response = {
        code: statusCode,
        message: (sanitizedMessage || '').trim(),
        ...(isDevEnv && {stack: err.stack}),
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
        success: false,
    };

    logger.error('Error while processing http request:', response);
    res.status(statusCode).send(response);
}

module.exports = {
    ApiError,
    errorConverter,
    errorHandler,
};
