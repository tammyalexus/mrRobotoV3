const config = require('../config.js');

// Set required role level for this command
const requiredRole = 'USER';

/**
 * Handles unknown commands
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @returns {Promise<Object>} Command result
 */
async function handleUnknownCommand(commandParams) {
  const { command, services } = commandParams;
  const { messageService } = services;
  const response = `❓ Unknown command: "${command}". Type ${config.COMMAND_SWITCH}help for available commands.`;
  await messageService.sendGroupMessage(response, { services });
  return {
    success: false,
    response,
    shouldRespond: true,
    error: 'Unknown command'
  };
}

// Attach role level to the function
handleUnknownCommand.requiredRole = requiredRole;

module.exports = handleUnknownCommand;
