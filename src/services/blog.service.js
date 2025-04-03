const Blog = require("../models/blog.model");

const createBlog = async (data) => await new Blog(data).save();
const getAllBlogs = async () => await Blog.find().populate("author", "firstName lastName email");
const getBlogById = async (id) => await Blog.findById(id).populate("author", "firstName lastName email");
const updateBlog = async (id, data) => await Blog.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteBlog = async (id) => await Blog.findByIdAndDelete(id);
const publishBlog = async (id) => await Blog.findByIdAndUpdate(id, { status: "published", publishDate: new Date() }, { new: true });

module.exports = { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog, publishBlog };