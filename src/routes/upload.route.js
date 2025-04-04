const express = require("express");
const router = express.Router();
const { uploadVideo, getUploadProgress } = require("../controllers/upload.controller");
const { createMediaMetaDetails } = require("../controllers/media-meta.controller");

router.post("/upload", uploadVideo);
router.get("/progress", getUploadProgress);
router.post("/metadata", createMediaMetaDetails);

module.exports = router;
