const config = require('../config.js');
const { logger } = require('../lib/logging.js');

/**
 * Asynchronously processes a single command
 * @param {string} commandText - The command string to process
 * @param {string} [commandId] - Optional command ID for logging
 * @returns {Promise<boolean>} True if command was processed successfully
 */
async function parseCommand(commandText, commandId = 'unknown') {
  // Validate input
  if (typeof commandText !== 'string' || !commandText.trim().length) {
    logger.warn(`Invalid command format (not a string or empty): ${commandId}`);
    return Promise.resolve(false);
  }

  try {
    const trimmedCommand = commandText.trim();
    logger.debug(`Processing command [${commandId}]: ${trimmedCommand}`);

    // Check if the command starts with the command switch
    if (!trimmedCommand.startsWith(config.COMMAND_SWITCH)) {
      logger.debug(`Command [${commandId}] does not start with command switch: ${config.COMMAND_SWITCH}`);
      return Promise.resolve(false);
    }

    // Extract the command name and arguments
    const parts = trimmedCommand.slice(config.COMMAND_SWITCH.length).trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    logger.debug(`Command [${commandId}]: ${command}, Args: ${args.join(', ')}`);

    // Process different commands
    switch (command) {
      case 'help':
        // Handle help command
        logger.debug(`Executing help command`);
        // Add help command logic here
        return Promise.resolve(true);

      case 'status':
        // Handle status command
        logger.debug(`Executing status command`);
        // Add status command logic here
        return Promise.resolve(true);

      // Add more command handlers as needed

      default:
        logger.debug(`Unknown command: ${command}`);
        return Promise.resolve(false);
    }
  } catch (error) {
    logger.error(`Failed to process command [${commandId}]:`, error.message);
    return Promise.resolve(false);
  }
}

module.exports = parseCommand;
