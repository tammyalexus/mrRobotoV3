// Set required role level for this command
const requiredRole = 'USER';

/**
 * Checks if the bot is responding
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @returns {Promise<Object>} Command result
 */
async function handlePingCommand(commandParams) {
  const { services } = commandParams;
  const { messageService } = services;
  const response = '🏓 Pong! Bot is alive and responding.';
  await messageService.sendGroupMessage(response, { services });
  return {
    success: true,
    response,
    shouldRespond: true
  };
}

// Attach role level to the function
handlePingCommand.requiredRole = requiredRole;

module.exports = handlePingCommand;
