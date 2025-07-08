// file-upload.utils.js
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');

class FileUploadUtils {
    static async uploadSingleFile(file) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            const bucket = new GridFSBucket(mongoose.connection.db, {
                bucketName: 'uploads'
            });

            const uploadStream = bucket.openUploadStream(file.originalname);
            uploadStream.end(file.buffer);

            return new Promise((resolve, reject) => {
                uploadStream.on('finish', () => {
                    resolve(uploadStream.id.toString());
                });
                uploadStream.on('error', (error) => {
                    reject('Error uploading single file: ' + error.message);
                });
            });
        } catch (error) {
            throw new Error('Error uploading single file: ' + error.message);
        }
    }

    static async uploadMultipleFiles(files) {
        try {
            if (!files || files.length === 0) {
                throw new Error('No files provided');
            }

            const fileUploadPromises = files.map(file => FileUploadUtils.uploadSingleFile(file));
            const fileIds = await Promise.all(fileUploadPromises);
            return fileIds.map((fileId, index) => ({ fileId, originalname: files[index].originalname }));
        } catch (error) {
            throw new Error('Error uploading multiple files: ' + error.message);
        }
    }

    static async generateFileUrl(fileId) {
        try {
            if (!fileId) {
                throw new Error('No file ID provided');
            }

            // Generate the download URL for the file from GridFS
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            return `${baseUrl}/api/v1/files/${fileId}`;
        } catch (error) {
            throw new Error('Error generating file URL: ' + error.message);
        }
    }

    static async generateFileUrls(files) {
        try {
            if (!files || files.length === 0) {
                throw new Error('No files provided');
            }

            const urls = files.map(file => {
                const fileNameWithoutExt = path.parse(file.originalname).name; // Get the file name without extension
                return {
                    url: FileUploadUtils.generateFileUrl(file.fileId),
                    alt: fileNameWithoutExt
                };
            });
            return await Promise.all(urls.map(async ({ url, alt }) => ({ url: await url, alt })));
        } catch (error) {
            throw new Error('Error generating file URLs: ' + error.message);
        }
    }
   

    
}

module.exports = { FileUploadUtils };