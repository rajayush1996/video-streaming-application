const logger = require("../features/logger");

/**
 * Polls fn() until check(result) is true or maxAttempts is reached.
 *
 * @param {() => Promise<any>} fn
 * @param {(result: any) => boolean} check
 * @param {{ intervalMs?: number, maxAttempts?: number }} opts
 * @returns {Promise<any>}
 */
async function poll(fn, check, opts = {}) {
    const intervalMs  = opts.intervalMs  || 5000;
    const maxAttempts = opts.maxAttempts || 60;
    let attempts = 0;
    logger.info(`[poll] Starting polling (interval=${intervalMs}ms, maxAttempts=${maxAttempts})`);

    while (true) {
        attempts++;
        logger.info(`[poll] Attempt ${attempts}/${maxAttempts}`);
        let result;
        try {
            result = await fn();
        } catch (err) {
            logger.error(`[poll] Error on attempt ${attempts}:`, err.message);
            if (attempts >= maxAttempts) throw err;
            await new Promise(r => setTimeout(r, intervalMs));
            continue;
        }

        let passed;
        try {
            passed = check(result);
        } catch (err) {
            logger.error(`[poll] Check function threw on attempt ${attempts}:`, err.message);
            throw err;
        }

        if (passed) {
            logger.info(`[poll] Check passed on attempt ${attempts}`);
            return result;
        }

        if (attempts >= maxAttempts) {
            const msg = `[poll] Timed out after ${attempts} attempts`;
            logger.error(msg);
            throw new Error(msg);
        }

        logger.info(`[poll] Check failed on attempt ${attempts}, waiting ${intervalMs}ms before next`);
        await new Promise((r) => setTimeout(r, intervalMs));
    }
}

module.exports = { poll };
