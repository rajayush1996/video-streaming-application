const express = require("express");
const router = express.Router();
const { uploadVideo, getUploadProgress } = require("../controllers/upload.controller");

router.post("/upload", uploadVideo);
router.get("/progress", getUploadProgress);

module.exports = router;
