const blogService = require("../services/blog.service");

/**
 * Create Blog
 */
exports.createBlog = async (req, res) => {
    try {
        const blog = await blogService.createBlog(req.body);
        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get All Blogs with Filters
 */
exports.getAllBlogs = async (req, res) => {
    try {
        const { status, author, page = 1, limit = 10 } = req.query;
        const filters = {};
        if (status) filters.status = status;
        if (author) filters.author = author;

        const blogs = await blogService.getAllBlogs(filters, parseInt(page), parseInt(limit));
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get Blog by ID
 */
exports.getBlogById = async (req, res) => {
    try {
        const blog = await blogService.getBlogById(req.params.id);
        if (!blog) return res.status(404).json({ error: "Blog not found" });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update Blog
 */
exports.updateBlog = async (req, res) => {
    try {
        const blog = await blogService.updateBlog(req.params.id, req.body);
        if (!blog) return res.status(404).json({ error: "Blog not found" });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete Blog
 */
exports.deleteBlog = async (req, res) => {
    try {
        await blogService.deleteBlog(req.params.id);
        res.json({ message: "Blog deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
