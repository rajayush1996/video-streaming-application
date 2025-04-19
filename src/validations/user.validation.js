const Joi = require('joi');

const updateProfileSchema = {
    body: Joi.object().keys({
        firstName: Joi.string().trim().min(1).max(50),
        lastName: Joi.string().trim().min(1).max(50),
        phoneNumber: Joi.string().pattern(/^[0-9]{10}$/),
        profileUrl: Joi.string().uri()
    })
};

module.exports = {
    updateProfileSchema
}; 