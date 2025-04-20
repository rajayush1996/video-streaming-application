const httpStatus = require("http-status");
const MediaMetaService = require("../services/mediaMeta.service");
const logger = require("../features/logger");

async function createMediaMetaDetails(req, res, next) {
    try {
        const { body } = req;
        
        // Add userId from JWT authentication
        if (req.user && req.user.id) {
            body.userId = req.user.id;
        } else {
            logger.warn("No user ID found in JWT token for media upload");
        }
        
        const result = await MediaMetaService.createMediaMetaInfo(body);
        return res.status(httpStatus.OK).json(result);
    } catch (error) {
        logger.error(error);
        next(error);
    }
}

module.exports = {
    createMediaMetaDetails,
}