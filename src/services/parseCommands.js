const services = require('./serviceContainer.js');

/**
 * Asynchronously processes a single command
 * @param {string} commandText - The command string to process
 * @param {string} [commandId] - Optional command ID for logging
 * @returns {Promise<boolean>} True if command was processed successfully
 */
async function parseCommand(commandText) {
  // Validate input
  if (typeof commandText !== 'string' || !commandText.trim().length) {
    services.logger.warn(`Invalid command format (not a string or empty): ${commandText}`);
    return Promise.resolve(false);
  }

  try {
    const trimmedCommand = commandText.trim();
    services.logger.debug(`Processing message: ${trimmedCommand}`);

    // Check if the command starts with the command switch
    if (!trimmedCommand.startsWith(services.config.COMMAND_SWITCH)) {
      return Promise.resolve(false);
    } else {
      return Promise.resolve(true);
    }

    // Extract the command name and arguments
    // const parts = trimmedCommand.slice(services.config.COMMAND_SWITCH.length).trim().split(/\s+/);
    // const command = parts[0].toLowerCase();
    // const args = parts.slice(1);

    // services.logger.debug(`Command: ${command}, Args: ${args.join(', ')}`);

  } catch (error) {
    services.logger.error(`Failed to process command:`, error.message);
    return Promise.resolve(false);
  }
}

module.exports = parseCommand;
