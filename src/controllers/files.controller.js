const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

class FilesController {
    static async getFileById(req, res) {
        try {
            const { fileId } = req.params;

            if (!fileId) {
                return res.status(400).send('No file ID provided');
            }

            const bucket = new GridFSBucket(mongoose.connection.db, {
                bucketName: 'uploads'
            });

            const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

            downloadStream.on('data', (chunk) => {
                res.write(chunk);
            });

            downloadStream.on('error', () => {
                res.status(404).send('File not found');
            });

            downloadStream.on('end', () => {
                res.end();
            });
        } catch (error) {
            res.status(500).send('Error retrieving file: ' + error.message);
        }
    }
}

module.exports = FilesController;