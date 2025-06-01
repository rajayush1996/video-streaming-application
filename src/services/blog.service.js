const Blog = require("../models/blog.model");
const MediaMeta = require("../models/mediaMeta.model");
const Category = require("../models/category.model");
const blogEventService = require("./blogEvent.service");
const logger = require("../features/logger");
const { ApiError } = require('../features/error');
const httpStatus = require("http-status");
const mongoose = require('mongoose');

/**
 * Create a new blog
 * @param {Object} blogData - The blog data
 * @param {string} adminId - The ID of the admin creating the blog
 * @returns {Promise<Blog>}
 */
exports.createBlog = async (blogData, adminId) => {
    try {
        // Verify media metadata exists
        const thumbnailMetadata = await MediaMeta.findById(blogData.thumbnailMetadata);
        if (!thumbnailMetadata) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid thumbnail metadata ID");
        }

        const contentMetadata = await MediaMeta.findById(blogData.contentMetadata);
        if (!contentMetadata) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid content metadata ID");
        }

        const blog = new Blog({
            ...blogData,
            type: 'blog',
            author: adminId,
            blogSpecific: {
                excerpt: blogData.excerpt,
                content: blogData.content,
                category: blogData.category,
                readTime: blogData.readTime,
                date: new Date(),
                thumbnailMetadata: thumbnailMetadata._id,
                contentMetadata: contentMetadata._id
            },
            status: blogData.status || 'draft',
            featured: blogData.featured || false
        });
        
        await blog.save();
        
        // Publish blog created event
        const publishSuccess = await blogEventService.publishBlogCreated(blog);
        
        if (!publishSuccess) {
            logger.warn(`Blog created but event publishing failed for blog ID ${blog._id}`);
        }

        return blog;
    } catch (error) {
        logger.error("Error in createBlog service:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.BAD_REQUEST, "Error creating blog");
    }
};

/**
 * Check if MongoDB supports transactions
 * @returns {Promise<boolean>}
 */
async function isSupportedTransactions() {
    try {
        // Check if MongoDB is running as replica set
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();
        return serverStatus && serverStatus.process === 'mongod' && 
               serverStatus.repl && serverStatus.repl.setName;
    } catch (error) {
        logger.warn("Failed to check if MongoDB supports transactions:", error);
        return false;
    }
}

/**
 * Get all blogs with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<{results: Array, page: number, limit: number, totalPages: number, totalResults: number}>}
 */
exports.getAllBlogs = async (filter = {}, options = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt:desc",
            includeDeleted = false,
            categoryId,
            featured,
        } = options;
  
        // Add deletedAt filter if not including deleted blogs
        if (!includeDeleted) {
            filter.deletedAt = null;
        }
  
        // Add category filter if provided
        if (categoryId) {
            // Verify category exists
            const category = await Category.findById(categoryId);
            if (!category) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category ID");
            }
            filter['blogSpecific.categoryId'] = categoryId;
        }

        // Add featured filter if provided
        if (featured !== undefined) {
            filter.featured = featured;
        }
  
        const blogs = await Blog.paginate(filter, {
            page,
            limit,
            sortBy,
            lean: true,
        });

        // After getting the paginated results, fetch the MediaMeta details
        if (blogs.results && blogs.results.length > 0) {
            const thumbnailIds = blogs.results
                .map(blog => blog.blogSpecific?.thumbnailMetadata)
                .filter(Boolean);
            const contentIds = blogs.results
                .map(blog => blog.blogSpecific?.contentMetadata)
                .filter(Boolean);

            const [thumbnailMetas, contentMetas] = await Promise.all([
                MediaMeta.find({ _id: { $in: thumbnailIds } }).lean(),
                MediaMeta.find({ _id: { $in: contentIds } }).lean()
            ]);

            // Create lookup maps
            const thumbnailMap = thumbnailMetas.reduce((acc, meta) => {
                acc[meta._id] = meta;
                return acc;
            }, {});
            const contentMap = contentMetas.reduce((acc, meta) => {
                acc[meta._id] = meta;
                return acc;
            }, {});

            // Update the results with MediaMeta details
            blogs.results = blogs.results.map(blog => {
                if (blog.blogSpecific?.thumbnailMetadata) {
                    blog.blogSpecific.thumbnailMetadata = thumbnailMap[blog.blogSpecific.thumbnailMetadata] || null;
                }
                if (blog.blogSpecific?.contentMetadata) {
                    blog.blogSpecific.contentMetadata = contentMap[blog.blogSpecific.contentMetadata] || null;
                }
                return blog;
            });
        }
  
        return blogs;
    } catch (error) {
        logger.error("Error in getAllBlogs service:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching blogs");
    }
};
  
/**
 * Get a blog by ID
 * @param {string} id - Blog ID
 * @param {boolean} includeDeleted - Whether to include soft-deleted blogs
 * @returns {Promise<Blog>}
 */
exports.getBlogById = async (id, includeDeleted = false) => {
    try {

        const query = Blog.findById(id);
        
        // Add deletedAt filter if not including deleted blogs
        if (!includeDeleted) {
            query.where({ deletedAt: null });
        }
        
        const blog = await query
            .populate('author', 'name email')
            .populate({
                path: 'blogSpecific.thumbnailMetadata',
                model: 'MediaMeta'
            })
            .populate({
                path: 'blogSpecific.contentMetadata',
                model: 'MediaMeta'
            })
            .populate({
                path: 'blogSpecific.categoryId',
                select: 'name slug description icon status',
                populate: {
                    path: 'icon',
                    model: 'MediaMeta'
                }
            })
            .lean();
        
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        return blog;
    } catch (error) {
        logger.error(`Error in getBlogById service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching blog");
    }
};

/**
 * Update a blog
 * @param {string} id - Blog ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Blog>}
 */
exports.updateBlog = async (id, updateData) => {
    try {
        const blog = await Blog.findById(id);
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }

        // Update thumbnail metadata if thumbnail is being updated
        if (updateData.thumbnail) {
            const thumbnailMetadata = await MediaMeta.findById(blog.blogSpecific.thumbnailMetadata);
            if (thumbnailMetadata) {
                thumbnailMetadata.thumbnailId = updateData.thumbnail;
                await thumbnailMetadata.save();
            }
        }

        // Update content metadata if content is being updated
        if (updateData.content) {
            const contentMetadata = await MediaMeta.findById(blog.blogSpecific.contentMetadata);
            if (contentMetadata) {
                contentMetadata.mediaFileId = updateData.content;
                contentMetadata.status = 'pending'; // Reset status for new content
                await contentMetadata.save();
            }
        }

        // Update blog
        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            { 
                $set: {
                    ...updateData,
                    blogSpecific: {
                        ...blog.blogSpecific,
                        excerpt: updateData.excerpt,
                        content: updateData.content,
                        category: updateData.category,
                        readTime: updateData.readTime
                    }
                }
            },
            { new: true, runValidators: true }
        );
        
        // Publish blog updated event
        const publishSuccess = await blogEventService.publishBlogUpdated(updatedBlog);
        
        if (!publishSuccess) {
            logger.warn(`Blog updated but event publishing failed for blog ID ${updatedBlog._id}`);
        }

        return updatedBlog;
    } catch (error) {
        logger.error(`Error in updateBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating blog");
    }
};

/**
 * Delete a blog (soft delete)
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
exports.deleteBlog = async (id) => {
    try {
        const blog = await Blog.findById(id);
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }

        // Soft delete associated media metadata
        await MediaMeta.findByIdAndUpdate(blog.blogSpecific.thumbnailMetadata, { isDeleted: true, deletedAt: new Date() });
        await MediaMeta.findByIdAndUpdate(blog.blogSpecific.contentMetadata, { isDeleted: true, deletedAt: new Date() });

        // Soft delete the blog
        const deletedBlog = await Blog.findByIdAndUpdate(
            id,
            { $set: { deletedAt: new Date() } },
            { new: true, runValidators: true }
        );
        
        // Publish blog deleted event
        const publishSuccess = await blogEventService.publishBlogDeleted(deletedBlog._id, deletedBlog.author);
        
        if (!publishSuccess) {
            logger.warn(`Blog deleted but event publishing failed for blog ID ${deletedBlog._id}`);
        }

        return deletedBlog;
    } catch (error) {
        logger.error(`Error in deleteBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting blog");
    }
};

/**
 * Restore a soft-deleted blog
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
exports.restoreBlog = async (id) => {
    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: { deletedAt: null } },
            { new: true, runValidators: true }
        );
        
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        return blog;
    } catch (error) {
        logger.error(`Error in restoreBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error restoring blog");
    }
};

/**
 * Publish a blog
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
exports.publishBlog = async (id) => {
    // Check if MongoDB supports transactions
    const supportsTransactions = mongoose.connection.db
        ? await isSupportedTransactions()
        : false;

    if (supportsTransactions) {
        // Use transactions if supported
        return publishBlogWithTransaction(id);
    } else {
        // Fall back to non-transactional approach
        return publishBlogWithoutTransaction(id);
    }
};

/**
 * Publish a blog with transaction support
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
async function publishBlogWithTransaction(id) {
    const session = await Blog.startSession();
    session.startTransaction();

    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: { status: "published", publishedAt: new Date() } },
            { new: true, runValidators: true, session }
        );
        
        if (!blog) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        // Publish blog published event
        const publishSuccess = await blogEventService.publishBlogPublished(blog);
        
        if (!publishSuccess) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to publish blog event");
        }

        await session.commitTransaction();
        return blog;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error in publishBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error publishing blog");
    } finally {
        session.endSession();
    }
}

/**
 * Publish a blog without transaction support
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
async function publishBlogWithoutTransaction(id) {
    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: { status: "published", publishedAt: new Date() } },
            { new: true, runValidators: true }
        );
        
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        // Publish blog published event
        const publishSuccess = await blogEventService.publishBlogPublished(blog);
        
        if (!publishSuccess) {
            // If event publishing fails, log but don't roll back (can't roll back without transactions)
            logger.warn(`Blog published but event publishing failed for blog ID ${blog._id}`);
        }
        
        return blog;
    } catch (error) {
        logger.error(`Error in publishBlog service (non-transactional) for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error publishing blog");
    }
}