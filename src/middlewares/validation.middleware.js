const Joi = require('joi');
const httpStatus = require('http-status');
const {pick} = require('../utils/utils');
const ApiError = require('../features/error');

const validate = schema => (req, res, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    const options = {stripUnknown: true};
    const {value, error} = Joi.compile(validSchema)
        .prefs({errors: {label: 'path'}})
        .validate(object, options);

    if (error) {
        const errorMessage = error.details
            .map(details => {
                const RegExpForArray = /^\*?body\./;
                const RegExpForInvalid = /Invalid body./i;
                details.message = details.message.replace(RegExpForInvalid, 'Invalid').replace(RegExpForArray, '');
                return details.message;
            })
            .join(',');
        return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }

    Object.assign(req, value);
    return next();
};

module.exports = {validate};
