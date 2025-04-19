const Joi = require('joi');

const signInSchema = {
    body: Joi.object().keys({
        identifier: Joi.string().required().trim().min(3).max(100)
            .description('Username or email for login'),
        password: Joi.string().required().min(8)
    })
};

module.exports = {
    signInSchema
}; 