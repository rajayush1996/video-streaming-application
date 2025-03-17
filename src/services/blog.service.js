const Blog = require("../models/blog.model");

/**
 * Create a new blog post
 */
exports.createBlog = async (data) => {
    const blog = new Blog(data);
    return await blog.save();
};

/**
 * Get all blogs with pagination & filtering
 */
exports.getAllBlogs = async (filters, page, limit) => {
    const query = filters ? { ...filters } : {};
    return await Blog.find(query).skip((page - 1) * limit).limit(limit);
};

/**
 * Get a blog by ID
 */
exports.getBlogById = async (id) => {
    return await Blog.findById(id);
};

/**
 * Update a blog post
 */
exports.updateBlog = async (id, data) => {
    return await Blog.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Delete a blog post
 */
exports.deleteBlog = async (id) => {
    return await Blog.findByIdAndDelete(id);
};
