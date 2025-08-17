const { logger } = require('../lib/logging.js');
const config = require('../config.js');

/**
 * Asynchronously processes a single command
 * @param {string} commandText - The command string to process
 * @param {Object} services - Services container with logger and config
 * @returns {Promise<boolean>} True if command was processed successfully
 */
async function parseCommand(commandText, services = null) {
  // Fallback to direct imports if services not provided (maintains backward compatibility)
  const logger = services?.logger || require('../lib/logging.js').logger;
  const config = services?.config || require('../config.js');

  // Validate input
  if (typeof commandText !== 'string' || !commandText.trim().length) {
    logger.warn(`Invalid command format (not a string or empty): ${commandText}`);
    return Promise.resolve(false);
  }

  try {
    const trimmedCommand = commandText.trim();
    logger.debug(`Processing message: ${trimmedCommand}`);

    // Check if the command starts with the command switch
    if (!trimmedCommand.startsWith(config.COMMAND_SWITCH)) {
      return Promise.resolve(false);
    } else {
      return Promise.resolve(true);
    }

    // Extract the command name and arguments
    // const parts = trimmedCommand.slice(config.COMMAND_SWITCH.length).trim().split(/\s+/);
    // const command = parts[0].toLowerCase();
    // const args = parts.slice(1);

    // logger.debug(`Command: ${command}, Args: ${args.join(', ')}`);

  } catch (error) {
    const errorMessage = error && typeof error === 'object' 
      ? (error.message || error.toString() || 'Unknown error object')
      : (error || 'Unknown error');
    
    logger.error(`Failed to process command: ${errorMessage}`);
    return Promise.resolve(false);
  }
}

module.exports = parseCommand;
