const httpStatus = require('http-status');
const UserCredentials = require('../models/userCredentials.model');
const  { ApiError } = require('../features/error');

const isCreator = async (req, res, next) => {
    try {
        const user = await UserCredentials.findById(req.user.id);
        if (!user || user.role !== 'creator') {
            throw new ApiError(httpStatus.FORBIDDEN, 'Only creators can perform this action');
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = isCreator; 