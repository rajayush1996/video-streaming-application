// feed.controller.js
const httpStatus = require('http-status');
const { responseHandler } = require('../features/error');
const FeedService = require('../services/feed.service');

class FeedController {
    // Create Feed
    async createFeed(req, res, next) {
        try {
            const feed = await FeedService.createFeed({
                ...req.body,
                media: req.files.length ? req.files: null
            });
            const msg = "Feed created successfully";
            return responseHandler(res, httpStatus.CREATED, msg, feed);
        } catch (error) {
            next(error);
        }
    }

    // Get Feed by ID
    async getFeedById(req, res, next) {
        try {
            const feed = await FeedService.getFeedById(req.params.id);
            if (!feed) {
                return next(new ApiError(httpStatus.BAD_REQUEST, "Feed not found"));
            }
            const msg = 'Feed by id fetched successfully'
            return responseHandler(res, httpStatus.OK, msg, feed);
        } catch (error) {
            next(error)
        }
    }

    async getFeedByUserId(req, res, next) {
        try {
            const feed = await FeedService.getAllFeeds(req.params.authorId);
            if (!feed) {
                return next(new ApiError(httpStatus.BAD_REQUEST, "Feed not found"));
            }
            const msg = 'Feed by id fetched successfully'
            return responseHandler(res, httpStatus.OK, msg, feed);
        } catch (error) {
            next(error)
        }
    }

    // Update Feed
    async updateFeed(req, res, next) {
        try {
            const updatedFeed = await FeedService.updateFeed(req.params.id, req.body);
            if (!updatedFeed) {
                return next(new ApiError(httpStatus.BAD_REQUEST, "Feed not found"));
            }
            const msg = "feed updated successfully!"
            return responseHandler(res, httpStatus.OK, msg, updatedFeed);
        } catch (error) {
            next(error)
        }
    }

    // Delete Feed
    async deleteFeed(req, res, next) {
        try {
            const deletedFeed = await FeedService.deleteFeed(req.params.id);
            if (!deletedFeed) {
                return res.status(404).json({ message: 'Feed not found' });
            }
            const msg = 'Feed deleted successfully'
            return responseHandler(res, httpStatus.OK, msg, deletedFeed);
        } catch (error) {
            next(error)
        }
    }

    // Get All Feeds
    async getAllFeeds(req, res, next) {
        try {
            const { authorId } = req.query;
            console.log("----", authorId)
            const query = {};
            if (authorId) {
                query.authorId = authorId;
            }
            const feeds = await FeedService.getAllFeeds(query);
            const msg = "feeds details fetched succesfully !"
            return responseHandler(res, httpStatus.OK, msg, feeds);
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new FeedController();