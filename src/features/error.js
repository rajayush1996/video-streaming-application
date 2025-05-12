const { v4: uuidv4 } = require('uuid');
const httpStatus = require('http-status');
const logger = require('./logger');
const mongoose = require('mongoose');
const config = require('../../config');

/**
 * Base error class capturing operational vs. programmer errors.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Extended API error with optional data payload.
 */
class ApiError extends AppError {
    constructor(statusCode, message, data = null) {
        super(message, statusCode);
        this.data = data;
    }
}

// Specific HTTP error types
class BadRequestError extends ApiError { constructor(message = 'Bad request') { super(400, message); } }
class UnauthorizedError extends ApiError { constructor(message = 'Unauthorized') { super(401, message); } }
class ForbiddenError extends ApiError { constructor(message = 'Forbidden') { super(403, message); } }
class NotFoundError extends ApiError { constructor(message = 'Not found') { super(404, message); } }
class ConflictError extends ApiError { constructor(message = 'Conflict') { super(409, message); } }

/**
 * Middleware: convert any thrown error into ApiError
 */
function errorConverter(err, req, res, next) {
    let error = err;

    if (!(error instanceof AppError)) {
        const statusCode =
      error.statusCode || (error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR);
        const message = error.message || httpStatus[statusCode];
        error = new AppError(message, statusCode);
    }

    // Handle expired access token separately
    if (error.message === 'ERR_TOKEN_EXPIRED') {
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json({ error: [{ msg: 'invalid access token', code: 'TOKEN_EXPIRED' }], code: 'TOKEN_EXPIRED' });
    }

    next(error);
}

/**
 * Global error-handling middleware
 */
function errorHandler(err, req, res, next) {
    let { statusCode, message } = err;

    // Treat non-operational errors as 500
    if (!err.isOperational) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[statusCode];
    }

    if (res.headersSent) {
        return next(err);
    }

    res.locals.errorMessage = err.message.trim();
    const isDevEnv = ['development', 'uat'].includes(config.env.environment);

    // Strip ANSI color codes
    const sanitizedMessage = (message || '').replace(/\x1B\[[0-9;]*[mGK]/g, '');

    const response = {
        code: statusCode,
        message: sanitizedMessage.trim(),
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
        success: false,
        ...(err.data && { data: err.data }),
        ...(isDevEnv && { stack: err.stack })
    };

    logger.error('Error while processing http request:', response);
    res.status(statusCode).json(response);
}

/**
 * Uniform success response wrapper
 */
function responseHandler(res, statusCode, message, data = null) {
    const response = {
        code: statusCode,
        message,
        ...(data && { data }),
        requestId: uuidv4(),
        success: true,
    };

    res.status(statusCode).json(response);
}

module.exports = {
    AppError,
    ApiError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    errorConverter,
    errorHandler,
    responseHandler
};
