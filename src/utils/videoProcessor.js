// videoProcessor.js
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import axios from 'axios';

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_PULL_ZONE   = process.env.BUNNY_PULL_ZONE;
const BUNNY_API_KEY     = process.env.BUNNY_ACCESS_KEY;

async function uploadToBunny(localPath, remotePath) {
    const data = await fs.readFile(localPath);
    await axios.put(
        `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${remotePath}`,
        data,
        {
            headers: {
                AccessKey:      BUNNY_API_KEY,
                'Content-Type': localPath.endsWith('.mp4')
                    ? 'video/mp4'
                    : 'image/jpeg'
            }
        }
    );
    return `https://${BUNNY_PULL_ZONE}/${remotePath}`;
}

export async function generateClipAndThumbnailFromHls(
    playlistUrl,
    startSec = 30,
    duration = 10
) {
    const tmpDir    = await fs.mkdtemp(path.join(os.tmpdir(), 'hls-'));
    const clipPath  = path.join(tmpDir, `clip-${Date.now()}.mp4`);   // ← single MP4
    const thumbPath = path.join(tmpDir, `thumb-${Date.now()}.jpg`);

    // 1) Create a lossless MP4 slice
    await new Promise((resolve, reject) => {
        ffmpeg(playlistUrl)
            .inputOptions(['-protocol_whitelist', 'file,http,https,tcp,tls'])
            .setStartTime(startSec)
            .setDuration(duration)
            .outputOptions(['-c copy'])          // ← stream‑copy, no re‑encode
            .output(clipPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });

    // 2) Grab one JPEG frame
    await new Promise((resolve, reject) => {
        ffmpeg(playlistUrl)
            .inputOptions(['-protocol_whitelist', 'file,http,https,tcp,tls'])
            .setStartTime(startSec)
            .frames(1)
            .output(thumbPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });

    // 3) Upload both
    const [ clipUrl, thumbUrl ] = await Promise.all([
        uploadToBunny(clipPath,  `clips/${path.basename(clipPath)}`),
        uploadToBunny(thumbPath, `thumbnails/${path.basename(thumbPath)}`)
    ]);

    // 4) Cleanup
    await fs.remove(tmpDir);

    return { clipUrl, thumbUrl };
}
