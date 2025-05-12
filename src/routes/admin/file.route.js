const express = require('express');
const FilesController = require('../../controllers/files.controller');
const auth = require('../../middlewares/auth.middleware');
const router = express.Router();

// Apply admin authentication to all routes
router.use(auth('admin'));

router.get('/:fileId', FilesController.getFileById);

module.exports = router;

