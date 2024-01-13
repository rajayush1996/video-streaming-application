const Joi = require('joi');

const userValidationSchema = {
    firstName: Joi.string().max(200).trim(),
    lastName: Joi.string().max(200).trim(),
    lname: Joi.string().lowercase(),
    phoneNumber: Joi.object({
        countryCode: Joi.string().required(),
        number: Joi.string().required().trim(),
    }).required(),
    hashedOtp: Joi.string(),
    isOtpVerified: Joi.boolean().default(false),
    description: Joi.string().trim(),
    role: Joi.string().valid('ASTROLOGER', 'CUSTOMER'),
};

const createUserSchema = {
    params: {},
    body: Joi.object()
        .keys({...userValidationSchema})
        .required(),
};

module.exports = {
    createUserSchema,
};
