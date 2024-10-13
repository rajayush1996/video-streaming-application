const Feed = require('../models/feed.model');
const utils = require('../utils');

class FeedService {
    async createFeed(data) {
        console.log("🚀 ~ file: feed.service.js:6 ~ FeedService ~ createFeed ~ data:", data);
        try {
            const files = await utils.FileUploadUtils.uploadMultipleFiles(data.media);
            const fileIds = files.map(file => file.fileId)
            console.log("🚀 ~ file: feed.service.js:9 ~ FeedService ~ createFeed ~ fileIds:", fileIds);
            data.media = fileIds;
           
            const feedInfoDoc = await Feed.create(data);
            const feedInfo = feedInfoDoc.toObject(); // Converts to a plain JS object
            const media = await utils.FileUploadUtils.generateFileUrls(files);
            console.log("🚀 ~ file: feed.service.js:15 ~ FeedService ~ createFeed ~ media:", media);
            const preparingPayload = {
                ...feedInfo,
                author: {
                    id: feedInfo.id,
                    firstName: "Ayush",
                    lastName: "Raj",
                    email: "ayushraj709@gmail.com",
                    imageUrl: "url",
                    profession: "Businessman"
                },
                media,
            }
            delete preparingPayload.authorId;
            return preparingPayload;
            // return true;
        } catch (error) {
            throw new Error('Error creating feed: ' + error.message);
        }
    }

    async getFeedById(feedId) {
        try {
            return await Feed.findById(feedId).populate('authorId').populate('mentions').populate('comments.commentId');
        } catch (error) {
            throw new Error('Error fetching feed: ' + error.message);
        }
    }

    async updateFeed(feedId, data) {
        try {
            return await Feed.findByIdAndUpdate(feedId, data, { new: true });
        } catch (error) {
            throw new Error('Error updating feed: ' + error.message);
        }
    }

    async deleteFeed(feedId) {
        try {
            return await Feed.findByIdAndDelete(feedId);
        } catch (error) {
            throw new Error('Error deleting feed: ' + error.message);
        }
    }

    async getAllFeeds() {
        try {
            return await Feed.find().populate('authorId').populate('mentions').populate('comments.commentId');
        } catch (error) {
            throw new Error('Error fetching all feeds: ' + error.message);
        }
    }
}

module.exports = new FeedService();
