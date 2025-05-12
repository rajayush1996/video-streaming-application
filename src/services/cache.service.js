const redisClient = require('../connection/redis.connection');
const logger = require('../features/logger');

class CacheService {
    constructor() {
        this.client = redisClient;
    }

    async set(key, value, expiryInSeconds = 0) {
        try {
            const stringValue = JSON.stringify(value);
            if (expiryInSeconds > 0) {
                await this.client.set(key, stringValue, 'EX', expiryInSeconds);
            } else {
                await this.client.set(key, stringValue);
            }
        } catch (error) {
            logger.error('Error setting cache:', error);
            throw error;
        }
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Error getting cache:', error);
            throw error;
        }
    }

    async delete(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error('Error deleting cache:', error);
            throw error;
        }
    }

    // Specific methods for refresh tokens
    async setRefreshToken(userId, token, expiryInSeconds = 7 * 24 * 60 * 60) { // 7 days default
        const key = `refresh_token:${userId}`;
        await this.set(key, { token }, expiryInSeconds);
    }

    async getRefreshToken(userId) {
        const key = `refresh_token:${userId}`;
        const data = await this.get(key);
        return data?.token || null;
    }

    async deleteRefreshToken(userId) {
        const key = `refresh_token:${userId}`;
        await this.delete(key);
    }
}

module.exports = new CacheService(); 