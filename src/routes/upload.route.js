const express = require("express");
const router = express.Router();
const authenticated = require('../middlewares/auth.middleware');
const { uploadVideo, getUploadProgress } = require("../controllers/upload.controller");
const { createMediaMetaDetails } = require("../controllers/media-meta.controller");

router.post("/upload", authenticated , uploadVideo);
router.get("/progress",authenticated, getUploadProgress);
router.post("/metadata",authenticated, createMediaMetaDetails);

module.exports = router;
