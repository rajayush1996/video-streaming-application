const multer = require('multer');

// const storage = multer.memoryStorage(); // Keeping files in memory; for production consider disk storage
const upload = multer({
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
});


module.exports = upload;
