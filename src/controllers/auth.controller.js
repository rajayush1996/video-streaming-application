const AuthService = require('../services/auth.service');
const httpStatus = require('http-status');
const logger = require('../features/logger');

async function verifyOtpUser(req, res, next) {
    try {
        const {body} = req;
        const result = await AuthService.verifyOtpUser(body);
        return res.status(httpStatus.OK).json(result);
    } catch (err) {
        logger.error(err);
        next(err);
    }
}

async function sendOtpUser(req, res, next) {
    try {
        const {body} = req;
        const result = await AuthService.sendOtpMessage(body);
        if (result) {
            return res.status(httpStatus.OK).json({message: 'otp send successfully!'});
        }

        return res.status(httpStatus.FORBIDDEN).json({status: false});
    } catch (err) {
        logger.error('Error in controller', err);
        next(err);
    }
}

module.exports = {
    verifyOtpUser,
    sendOtpUser,
};
