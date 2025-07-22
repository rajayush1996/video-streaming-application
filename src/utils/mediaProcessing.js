const logger = require('../features/logger');
const { poll } = require('../utils/poll');


const VIDEO_READY_STATUS = 3;
/**
 * Starts a fire‑and‑forget loop that polls until the media is ready,
 * then updates the record to “completed” or “error”.
 *
 * @param {Object} params
 * @param {string} params.recordId
 * @param {() => Promise<any>} params.fetchStatus
 * @param {(data: any) => Object} params.buildUpdatePayload
 * @param {(id: string, update: Object) => Promise<any>} params.updateRecord
 * @param {number} [params.intervalMs]
 * @param {number} [params.maxAttempts]
 */
function startMediaProcessing({
    recordId,
    fetchStatus,
    buildUpdatePayload,
    updateRecord,
    intervalMs  = 5000,
    maxAttempts = 60,
}) {
    logger.info(`Kick off for record ${recordId}, updateRecord ${updateRecord}`);
    (async () => {
        try {
            const data = await poll(
                () => fetchStatus(),
                (d) => d.video && d.video.status === VIDEO_READY_STATUS,
                { intervalMs, maxAttempts }
            );

            const updatePayload = buildUpdatePayload(data);
            await updateRecord(recordId, {
                ...updatePayload,
                processingStatus: 'completed',
                errorMessage: null,
            });

            logger.info('Polling close and updated!');
        } catch (err) {
            await updateRecord(recordId, {
                processingStatus: 'error',
                errorMessage: err.message || String(err),
            });
        }
    })();
}

module.exports = { startMediaProcessing };
