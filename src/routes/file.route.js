const express = require('express');
const FilesController = require('../controllers/files.controller');
const router = express.Router();

router.get('/:fileId', FilesController.getFileById);

module.exports = router;

