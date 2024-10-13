const { ApiHelper } = require('../../utils'); // Import the ApiHelper class
const config = require('../../../config/config');
const logger = require('../../features/logger');
// Create an instance of ApiHelper for the Config Service
const configApiHelper = new ApiHelper(config.internal_apis.config_domain, {
    'x-api-key': config.internal_apis.api_key, // Default headers for Config Service
});

// Method to fetch configuration data from the Config Service
const fetchConfig = async () => {
    try {
        // Call the `get` method of ApiHelper to fetch the configuration
        const configData = await configApiHelper.get('/config');
        logger.debug(`Config has been fetched from ${JSON.stringify(configData)}`);
        return configData; // Return the configuration data
    } catch (error) {
        console.error('Error fetching config from Config Service:', error.message);
        throw error;
    }
};

module.exports = { fetchConfig };
