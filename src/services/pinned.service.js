// pinnedPost.service.js
const PinnedPost = require('../models/pinned.model');
const FeedService = require('../services/feed.service');


class  PinnedPostService {
    // Pin a post
    async pinPost(userId, postId) {
        try {
            // Check if the post is already pinned
            const existingPinnedPost = await PinnedPost.findOne({ userId, postId });
            if (existingPinnedPost) {
                throw new Error('Post is already pinned');
            }

            // Create a new pinned post record
            const pinnedPost =  await PinnedPost.create({ userId, postId });
            return pinnedPost;
        } catch (error) {
            throw new Error('Error pinning post: ' + error.message);
        }
    }

    // Unpin a post
    async unpinPost(userId, postId) {
        try {
            // Remove the pinned post record
            const result = await PinnedPost.findOneAndDelete({ userId, postId });
            if (!result) {
                throw new Error('Pinned post not found');
            }

            return result;
        } catch (error) {
            throw new Error('Error unpinning post: ' + error.message);
        }
    }

    // Get all pinned posts by a specific user
    async getPinnedPostsByUser(userId) {
        try {
            const pinnedPosts = await PinnedPost.find({ userId });
            console.log("🚀 ~ PinnedPostService ~ getPinnedPostsByUser ~ pinnedPosts:", pinnedPosts)
            if (!pinnedPosts || pinnedPosts.length === 0) {
                throw new Error('No pinned posts found for this user');
            }
            const postIds = pinnedPosts.map(pinned => pinned.postId);
            const filter = { _id: { $in: postIds } }
            const postDetails = await FeedService.getAllFeeds(filter);
            // Extract post details from populated pinned posts
            return postDetails;
        } catch (error) {
            throw new Error('Error fetching pinned posts: ' + error.message);
        }
    }

    async getPinnedPostsByPostId({ postId, userId }) {
        try {
            const pinnedPosts = await PinnedPost.findOne({ postId, userId });
            console.log("🚀 ~ PinnedPostService ~ getPinnedPostsByPostId ~ pinnedPosts:", pinnedPosts)
            if(pinnedPosts) {
                const feedDetails = await FeedService.getFeedById(postId);
                return feedDetails;
            } 
            throw new Error('No pinned post found for this user');
        } catch(error) {
            throw new Error('Error fetching pinned posts: ' + error.message);
        }
    }
}

module.exports = new PinnedPostService();