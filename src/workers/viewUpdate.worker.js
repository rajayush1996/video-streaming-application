const viewEventService = require('../services/viewEvent.service');
const videoViewService = require('../services/videoView.service');
const logger = require('../features/logger');

async function start() {
    await viewEventService.subscribe(async ({ mediaId }) => {
        if (!mediaId) return;
        try {
            await videoViewService.incrementViewCountInDb(mediaId);
        } catch (error) {
            logger.error(`Failed to process view increment for ${mediaId}:`, error);
        }
    });
}

module.exports = { start };
