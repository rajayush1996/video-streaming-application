const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller");
const validate = require("../middleware/validationMiddleware");
const blogSchema = require("../validations/blogValidation");

router.post("/", blogController.createBlog);
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.put("/:id", validate(blogSchema), blogController.updateBlog);
router.delete("/:id", blogController.deleteBlog);

module.exports = router;
