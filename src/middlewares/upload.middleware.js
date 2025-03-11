const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const { chunkIndex } = req.body;
        const originalName = file.originalname;
        cb(null, `${originalName}.chunk_${chunkIndex}`);
    },
});

const upload = multer({ storage });
module.exports = upload;
