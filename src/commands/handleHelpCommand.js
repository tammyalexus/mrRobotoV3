const config = require('../config.js');

// Set required role level for this command
const requiredRole = 'USER';

/**
 * Shows available commands and their usage
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @returns {Promise<Object>} Command result
 */
async function handleHelpCommand(commandParams) {
  const { services } = commandParams;
  const { messageService } = services;
  const helpText = `🤖 Available Commands:\n${config.COMMAND_SWITCH}help - Show this help message\n${config.COMMAND_SWITCH}ping - Check if bot is responding\n${config.COMMAND_SWITCH}status - Show bot status\n${config.COMMAND_SWITCH}echo [message] - Echo back your message`;
  await messageService.sendGroupMessage(helpText);
  return {
    success: true,
    response: helpText,
    shouldRespond: true
  };
}

// Attach role level to the function
handleHelpCommand.requiredRole = requiredRole;

module.exports = handleHelpCommand;
