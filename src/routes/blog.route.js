const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller");
const authenticated = require("../middlewares/auth.middleware");

// const validate = require("../middlewares/validation.middleware");
// const blogSchema = require("../validations/blogValidation");

router.post("/", authenticated, blogController.createBlog);
router.get("/", authenticated, blogController.getAllBlogs);
router.get("/:id", authenticated, blogController.getBlogById);
router.put("/:id", authenticated, blogController.updateBlog);
// validate(blogSchema),
router.delete("/:id", authenticated, blogController.deleteBlog);

module.exports = router;
