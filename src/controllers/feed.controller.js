// feed.controller.js
const FeedService = require('../services/feed.service');

class FeedController {
    // Create Feed
    async createFeed(req, res, next) {
        // console.log("🚀 ~ file: feed.controller.js:7 ~ FeedController ~ createFeed ~ req:", req);
        try {
            const {
                type,
                authorId,
                content,
                visibility,
                tags,
            } = req.body;
            const mediaPaths = [];
            
            const feed = await FeedService.createFeed({
                type,
                authorId,
                content,
                visibility,
                tags,
                media: req.files
            });
            res.status(201).json(feed);
        } catch (error) {
           next(error);
        }
    }

    // Get Feed by ID
    async getFeedById(req, res) {
        try {
            const feed = await FeedService.getFeedById(req.params.id);
            if (!feed) {
                return res.status(404).json({ message: 'Feed not found' });
            }
            res.status(200).json(feed);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update Feed
    async updateFeed(req, res) {
        try {
            const updatedFeed = await FeedService.updateFeed(req.params.id, req.body);
            if (!updatedFeed) {
                return res.status(404).json({ message: 'Feed not found' });
            }
            res.status(200).json(updatedFeed);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Delete Feed
    async deleteFeed(req, res) {
        try {
            const deletedFeed = await FeedService.deleteFeed(req.params.id);
            if (!deletedFeed) {
                return res.status(404).json({ message: 'Feed not found' });
            }
            res.status(200).json({ message: 'Feed deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get All Feeds
    async getAllFeeds(req, res) {
        try {
            const feeds = await FeedService.getAllFeeds();
            res.status(200).json(feeds);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new FeedController();