const Feed = require('../models/feed.model');
const utils = require('../utils');

class FeedService {
    async createFeed(data) {
        // // // // // console.log("🚀 ~ file: feed.service.js:6 ~ FeedService ~ createFeed ~ data:", data);
        try {
            if(data.media) {
                const files = await utils.FileUploadUtils.uploadMultipleFiles(data.media);
                data.media = files;
            }
           
            const feedInfoDoc = await Feed.create(data);
            const feedInfo = feedInfoDoc.toObject(); // Converts to a plain JS object
            let preparingPayload = {
                ...feedInfo,
                author: {
                    id: feedInfo.authorId,
                    firstName: "Ayush",
                    lastName: "Raj",
                    email: "ayushraj709@gmail.com",
                    imageUrl: {
                        url: "url",
                        alt: "url"
                    },
                    profession: "Businessman"
                },
            }
            if(data.media) {
                const media = await utils.FileUploadUtils.generateFileUrls(data.media);
                preparingPayload.media = media;
            }
            delete preparingPayload.authorId;
            preparingPayload = utils.formatDoc(preparingPayload);
            return preparingPayload;
            // return true;
        } catch (error) {
            throw new Error('Error creating feed: ' + error.message);
        }
    }

    async getFeedById(feedId) {
        try {
            const feedDetails = await Feed.findOne({ _id: feedId, isDeleted: false }).lean(true);
            let preparingPayload = {
                ...feedInfo,
                author: {
                    id: feedInfo.authorId,
                    firstName: "Ayush",
                    lastName: "Raj",
                    email: "ayushraj709@gmail.com",
                    imageUrl: {
                        url: "url",
                        alt: "url"
                    },
                    profession: "Businessman"
                },
            };
            if(data.media) {
                const media = await utils.FileUploadUtils.generateFileUrls(data.media);
                preparingPayload.media = media;
            }
            delete preparingPayload.authorId;
            preparingPayload = utils.formatDoc(preparingPayload);
            return preparingPayload;
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

    async getAllFeeds(filter) {
        try {
            const allFeeds = await Feed.paginate({ ...filter, isDeleted: false }, { lean: true });
            const authorDetail = {
                firstName: "Ayush",
                lastName: "Raj",
                email: "ayushraj709@gmail.com",
                imageUrl: {
                    url: "url",
                    alt: "url"
                },
                profession: "Businessman"
            }
            
            let preparingFeedDetails = await Promise.all((allFeeds.results || []).map(async (eachFeed) => {
                eachFeed.author = authorDetail;
                eachFeed.author.id = eachFeed.authorId;
                delete eachFeed.authorId;
                let media = []
                if (eachFeed.media) {
                    media = await utils.FileUploadUtils.generateFileUrls(eachFeed.media);
                }
                return { ...eachFeed, media };
            }));
            preparingFeedDetails = utils.formatDocArray(preparingFeedDetails);
            allFeeds.results = preparingFeedDetails;
            return allFeeds;
        } catch (error) {
            throw new Error('Error fetching all feeds: ' + error.message);
        }
    }
}

module.exports = new FeedService();
