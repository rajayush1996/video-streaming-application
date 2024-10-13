// src/config/redis.config.js
const redis = require('redis');
const config = require('../../config/config');

// Create a Redis client
const redisClient = redis.createClient({
    // url: `redis://:${config.redis.password}@${config.redis.host}:${config.redis.port}`
    url: `redis://:@${config.redis.host}:${config.redis.port}`

});

// Set up Redis event listeners
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('ready', () => {
    console.log('Redis client is ready');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisClient.on('end', () => {
    console.log('Redis connection closed');
});

// Export the Redis client (singleton)
module.exports = redisClient;
