// Set required role level for this command
const requiredRole = 'USER';

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Shows the current status of the bot
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @returns {Promise<Object>} Command result
 */
async function handleStatusCommand(commandParams) {
  const { services } = commandParams;
  const { messageService } = services;
  const uptime = process.uptime();
  const uptimeFormatted = formatUptime(uptime);
  const response = `🤖 Bot Status:\n✅ Online and operational\n⏱️ Uptime: ${uptimeFormatted}`;
  await messageService.sendGroupMessage(response);
  return {
    success: true,
    response,
    shouldRespond: true
  };
}

// Attach role level to the function
handleStatusCommand.requiredRole = requiredRole;

module.exports = handleStatusCommand;
