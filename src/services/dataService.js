const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../lib/logging.js');

class DataService {
    constructor() {
        this.data = {};
    }

    /**
     * Load data from the data.json file at project root
     * @returns {Promise<Object>} The loaded data
     * @throws {Error} If the file cannot be read or parsed
     */
    async loadData() {
        try {
            const dataPath = path.join(process.cwd(), 'data.json');
            const fileContent = await fs.readFile(dataPath, 'utf8');
            
            try {
                this.data = JSON.parse(fileContent);
                logger.info('Successfully loaded data from data.json');
                logger.debug(`data: ${JSON.stringify(this.data, null, 2)}`);
                return this.data;
            } catch (parseError) {
                logger.error(`Failed to parse data.json: ${parseError.message}`);
                throw parseError;
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.warn('data.json not found, using empty data object');
                this.data = {};  // Reset to empty object
                return this.data;
            }
            logger.error(`Error loading data.json: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get a value from the loaded data
     * @param {string} key - The key to look up, can be a dot-notation path (e.g., 'botData.CHAT_NAME')
     * @returns {*} The value for the key, or undefined if not found
     */
    getValue(key) {
        return key.split('.').reduce((obj, k) => obj?.[k], this.data);
    }

    /**
     * Get all loaded data
     * @returns {Object} The entire data object
     */
    getAllData() {
        return this.data;
    }
}

module.exports = DataService;
