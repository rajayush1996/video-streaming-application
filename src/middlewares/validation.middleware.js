const { BadRequestError } = require('../features/error');

const validate = (schema) => {
    return (req, res, next) => {
        const validationSchema = {
            body: schema.body || {},
            query: schema.query || {},
            params: schema.params || {}
        };

        const validationResult = {
            body: validationSchema.body.validate ? validationSchema.body.validate(req.body, { abortEarly: false, stripUnknown: true }) : { error: null },
            query: validationSchema.query.validate ? validationSchema.query.validate(req.query, { abortEarly: false, stripUnknown: true }) : { error: null },
            params: validationSchema.params.validate ? validationSchema.params.validate(req.params, { abortEarly: false, stripUnknown: true }) : { error: null }
        };

        const errors = [];
        if (validationResult.body.error) errors.push(...validationResult.body.error.details);
        if (validationResult.query.error) errors.push(...validationResult.query.error.details);
        if (validationResult.params.error) errors.push(...validationResult.params.error.details);

        if (errors.length > 0) {
            const errorMessage = errors.map((detail) => detail.message).join(', ');
            return next(new BadRequestError(errorMessage));
        }

        next();
    };
};

module.exports = { validate };
