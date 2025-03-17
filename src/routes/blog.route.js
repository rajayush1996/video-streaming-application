const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller");
const validate = require("../middlewares/validation.middleware");
// const blogSchema = require("../validations/blogValidation");

router.post("/", blogController.createBlog);
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.put("/:id",  blogController.updateBlog);
// validate(blogSchema),
router.delete("/:id", blogController.deleteBlog);

module.exports = router;
