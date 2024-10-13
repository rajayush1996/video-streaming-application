class ConfigStore {
    constructor() {
        this.config = {}; // Initialize an empty object to store configuration
    }

    // Method to set the config (typically called in app.js)
    setConfig(configData) {
        this.config = configData;
    }

    // Method to get a specific config value by key
    getConfigValue(key) {
        return this.config[key];
    }

    // Method to retrieve the entire config object
    getConfig() {
        return this.config;
    }

    // Method to update a specific config value (if needed)
    updateConfigValue(key, value) {
        this.config[key] = value;
    }
}

// Create a singleton instance of ConfigStore
const configStore = new ConfigStore();
module.exports = configStore;
