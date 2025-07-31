// syncVideoMetadata.js
const mongoose = require('mongoose');
const VideoMetaModel = require('../models/videoMetaData'); // <-- adjust path to your schema
const connectDB = require('../connection/db');
const { fetchVideoDataByGuid } = require('../utils/bunny.utils');

// 1. Fetch metadata from BunnyCDN

// 2. Update video with new metadata
function buildUpdateData(metaData) {
    const meta = metaData.video;
    return {
        libraryId: meta.videoLibraryId,
        videoUrl: metaData.videoPlaylistUrl,
        previewUrl: metaData.previewUrl,
        thumbnailUrl: metaData.thumbnailUrl,
        encodeProgress: meta.encodeProgress,
        width: meta.width,
        height: meta.height,
        framerate: meta.frameRate,
        rotation: meta.rotation,
        lengthSec: meta.length,
        availableResolutions: Array.isArray(meta.availableResolutions)
            ? meta.availableResolutions
            : String(meta.availableResolutions).split(','),
        storageSizeBytes: meta.storageSize,
        outputCodecs: Array.isArray(meta.outputCodecs)
            ? meta.outputCodecs
            : String(meta.outputCodecs).split(','),
        dateUploaded: meta.dateUploaded ? new Date(meta.dateUploaded) : undefined,
        processingStatus: 'done',
    };
}

// 3. Main sync loop
async function syncMetadata() {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // const processingVideos = await VideoMetaModel.find({ processingStatus: 'processing' });
    const processingVideos = await VideoMetaModel.find({ libraryId: { $exists: false } });


    console.log(`📦 Found ${processingVideos.length} videos to sync`);

    for (const video of processingVideos) {
        const { guid } = video;
        if (!guid) continue;

        console.log(`➡️ Fetching metadata for ${guid}`);
        const metadata = await fetchVideoDataByGuid(guid);
        if (!metadata) continue;

        const update = buildUpdateData(metadata);
        await VideoMetaModel.updateOne({ guid }, { $set: update });

        console.log(`✅ Updated video ${guid}`);
    }

    console.log('🎉 Sync completed');
    await mongoose.disconnect();
}

syncMetadata().catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
