const axios = require('axios');
const logger = require('../features/logger');

class ApiHelper {
    constructor(baseURL, defaultHeaders = {}, defaultOptions = {}) {
        this.baseURL = baseURL;
        this.defaultHeaders = defaultHeaders;
        this.defaultOptions = defaultOptions;
    }

    // Method for GET requests
    async get(endpoint, headers = {}, options = {}) {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers: { ...this.defaultHeaders, ...headers },
                timeout: options.timeout || this.defaultOptions.timeout || 5000,
                ...options, // Spread additional options
            });

            // Log the response details to check the structure
            logger.debug('Received response from Config Service:', response.data);

            // Ensure the response is a plain object
            if (typeof response.data !== 'object' || Array.isArray(response.data)) {
                throw new Error(`Expected a plain object, but received ${typeof response.data}`);
            }

            return response.data; // Return the JSON response body
        } catch (error) {
            console.error(`Error in GET request to ${this.baseURL}${endpoint}:`, error.message);
            // Pass error details along to the caller
            throw error.response ? error.response.data : new Error(error.message);
        }
    }

    // Method for POST requests
    async post(endpoint, data, headers = {}, options = {}) {
        try {
            const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
                headers: { ...this.defaultHeaders, ...headers },
                timeout: options.timeout || this.defaultOptions.timeout || 5000,
                ...options, // Spread additional options
            });

            return response.data; // Return the JSON response body
        } catch (error) {
            console.error(`Error in POST request to ${this.baseURL}${endpoint}:`, error.message);
            // Pass error details along to the caller
            throw error.response ? error.response.data : new Error(error.message);
        }
    }
}

module.exports = { ApiHelper };
