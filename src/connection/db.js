const mongoose = require('mongoose');
const logger = require('../features/logger');
const config = require('../../config/config');
const seedEmailProviders = require('../seeds/emailProvider.seed');

const connectDB = async () => {
    try {
        const dbUri = `${config.database.url}${config.database.dbname}`;
        await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
        if (config.debug_mongoose) {
            mongoose.set('debug', true);
        }
        logger.info('db connected');
        await seedEmailProviders();
    } catch (err) {
        logger.error('db error', err);
    }
};

module.exports = connectDB;
