const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const uploadController = require("../controllers/upload.controller");

router.post("/video-chunk", upload.single("video"), uploadController.uploadChunk);
router.post("/upload-init", uploadController.initUpload);


module.exports = router;
