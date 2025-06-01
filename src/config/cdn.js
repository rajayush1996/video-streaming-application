const path = require('path');

const config = {
    // Toggle between local and BunnyCDN storage
    use_bunny_cdn: process.env.USE_BUNNY_CDN === 'true',

    // Local storage configuration
    local: {
        upload_path: path.join(__dirname, '../../uploads'),
        base_url: process.env.LOCAL_STORAGE_URL || 'http://localhost:5000/uploads',
        allowed_types: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
        max_file_size: 500 * 1024 * 1024, // 500MB
    },

    // BunnyCDN configuration
    bunny: {
        storage_host: process.env.BUNNY_STORAGE_HOST,
        storage_zone: process.env.BUNNY_STORAGE_ZONE,
        access_key: process.env.BUNNY_ACCESS_KEY,
        pull_zone: process.env.BUNNY_PULL_ZONE,
        video_container: process.env.BUNNY_VIDEO_CONTAINER || 'videos',
        thumbnail_container: process.env.BUNNY_THUMBNAIL_CONTAINER || 'thumbnails',
        allowed_types: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
        max_file_size: 500 * 1024 * 1024, // 500MB
    }
};

module.exports = config; 