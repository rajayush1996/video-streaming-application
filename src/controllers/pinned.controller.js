// pinnedPost.controller.js
const httpStatus = require('http-status');
const PinnedPostService = require('../services/pinned.service');
const { ApiError, responseHandler } = require('../features/error');

class PinnedPostController {
    // Pin a post
    static async pinPost(req, res) {
        const { authorId } = req.body; // Assuming userId is sent in the request body
        const { postId } = req.params;

        try {
            const pinnedPost = await PinnedPostService.pinPost(authorId, postId);
            const msg = "Post pinned successfully"
            return responseHandler(res, httpStatus.CREATED, msg, pinnedPost)
        } catch (error) {
            res.status(500).json({ message: 'Error pinning post: ' + error.message });
        }
    }

    // Unpin a post
    static async unpinPost(req, res) {
        const { authorId } = req.body; // Assuming userId is sent in the request body
        const { postId } = req.params;

        try {
            await PinnedPostService.unpinPost(authorId, postId);
            const msg = 'Post unpinned successfully';
            return responseHandler(res, httpStatus.CREATED, msg, {})

        } catch (error) {
            res.status(500).json({ message: 'Error unpinning post: ' + error.message });
        }
    }

    // Get all pinned posts by a specific user
    static async getPinnedPostsByUser(req, res, next) {
        const { authorId } = req.params;
        try {
            if(!authorId) {
                return next(new ApiError(httpStatus.BAD_REQUEST, "authorId is not present"));
            }
            const pinnedPosts = await PinnedPostService.getPinnedPostsByUser(authorId);
            const msg = "response fetched successfully"
            return responseHandler(res, httpStatus.OK, msg, pinnedPosts)
        } catch (error) {
            next(error);
        }
    }

    static async getPinnedPostsByPostId(req, res, next) {
        const { postId } = req.params;
        const { authorId } = req.query;
        try {
            if(!authorId) {
                return next(new ApiError(httpStatus.BAD_REQUEST, "authorId is not present"));
            }
            const pinnedPost = await PinnedPostService .getPinnedPostsByPostId({ postId, userId: authorId });
            const msg = "response fetched successfully";
            return responseHandler(res, httpStatus.OK, msg, pinnedPost)
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PinnedPostController;