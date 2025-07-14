const blogService = require("../services/blog.service");
const httpStatus = require("http-status");
const logger = require("../features/logger");
const { responseHandler } = require("../features/error");

/**
 * Create a new blog
 * @route POST /api/v1/blogs
 */
exports.createBlog = async (req, res, next) => {
    try {
        const { category, ...blogData } = req.body;

        // console.log("🚀 ~ exports.createBlog= ~  req.user:",  req.user)
        // console.log("🚀 ~ exports.createBlog= ~  req.body:",  req.body)
        const blog = await blogService.createBlog(
            { ...blogData, category },
            req.user.id // Admin ID from JWT
        );

        responseHandler(res, httpStatus.CREATED, "Blog created successfully", blog);
    } catch (error) {
        logger.error("Error creating blog:", error);
        next(error);
    }
};

/**
 * Get all blogs with pagination
 * @route GET /api/v1/blogs
 */
exports.getAllBlogs = async (req, res, next) => {
    try {
        // Extract query parameters
        const { page, limit, sortBy, status, category, includeDeleted, featured } = req.query;
        
        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (featured) filter.featured = featured === 'true';
        
        // Build options
        const options = {};
        if (page) options.page = parseInt(page);
        if (limit) options.limit = parseInt(limit);
        if (sortBy) options.sortBy = sortBy; // Already in format "field:direction"
        if (includeDeleted) options.includeDeleted = includeDeleted === 'true';
        if (category) options.category = category;
        
        const blogs = await blogService.getAllBlogs(filter, options);
        responseHandler(res, httpStatus.OK, "Blogs retrieved successfully", blogs);
    } catch (error) {
        logger.error("Error getting all blogs:", error);
        next(error);
    }
};

/**
 * Get a blog by ID
 * @route GET /api/v1/blogs/:id
 */
exports.getBlogById = async (req, res, next) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const blog = await blogService.getBlogById(req.params.id, includeDeleted);
        if (!blog) {
            return responseHandler(res, httpStatus.NOT_FOUND, "Blog not found");
        }
        responseHandler(res, httpStatus.OK, "Blog retrieved successfully", blog);
    } catch (error) {
        logger.error(`Error getting blog by ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Update a blog
 * @route PUT /api/v1/blogs/:id
 */
exports.updateBlog = async (req, res, next) => {
    try {
        const blog = await blogService.updateBlog(req.params.id, req.body);
        if (!blog) {
            return responseHandler(res, httpStatus.NOT_FOUND, "Blog not found");
        }
        responseHandler(res, httpStatus.OK, "Blog updated successfully", blog);
    } catch (error) {
        logger.error(`Error updating blog ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Delete a blog (soft delete)
 * @route DELETE /api/v1/blogs/:id
 */
exports.deleteBlog = async (req, res, next) => {
    try {
        const blog = await blogService.deleteBlog(req.params.id);
        if (!blog) {
            return responseHandler(res, httpStatus.NOT_FOUND, "Blog not found");
        }
        responseHandler(res, httpStatus.OK, "Blog deleted successfully");
    } catch (error) {
        logger.error(`Error deleting blog ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Restore a soft-deleted blog
 * @route PUT /api/v1/blogs/:id/restore
 */
exports.restoreBlog = async (req, res, next) => {
    try {
        const blog = await blogService.restoreBlog(req.params.id);
        if (!blog) {
            return responseHandler(res, httpStatus.NOT_FOUND, "Blog not found");
        }
        responseHandler(res, httpStatus.OK, "Blog restored successfully", blog);
    } catch (error) {
        logger.error(`Error restoring blog ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Publish a blog
 * @route PUT /api/v1/blogs/:id/publish
 */
exports.publishBlog = async (req, res, next) => {
    try {
        const blog = await blogService.publishBlog(req.params.id);
        if (!blog) {
            return responseHandler(res, httpStatus.NOT_FOUND, "Blog not found");
        }
        responseHandler(res, httpStatus.OK, "Blog published successfully", blog);
    } catch (error) {
        logger.error(`Error publishing blog ${req.params.id}:`, error);
        next(error);
    }
};
