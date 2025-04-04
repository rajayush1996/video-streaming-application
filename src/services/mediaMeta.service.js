const MediaMeta = require("../models/mediaMeta.model");

class MediaMetaService {
    async createMediaMetaInfo(metaInfo) {
        try {
            return MediaMeta.create(metaInfo);
        } catch (error) {
            throw error;
        }
    }

}

module.exports = new MediaMetaService();