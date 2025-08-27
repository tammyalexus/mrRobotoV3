const fs = require('fs').promises;
const path = require('path');

// Set required role level for this command
const requiredRole = 'OWNER';

/**
 * Handles the state command - dumps current hangout state to a log file
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @returns {Promise<Object>} Command result
 */
async function handleStateCommand(commandParams) {
  const { services } = commandParams;
  try {
    const state = services?.hangoutState || null;
    if (!state) {
      const response = '⚠️ No hangout state available to save.';
      await services.messageService.sendGroupMessage(response, { services });
      return {
        success: false,
        response,
        shouldRespond: true
      };
    }
    const logsDir = path.join(process.cwd(), 'logs');
    const datetime = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `currentState_${datetime}.log`;
    const filePath = path.join(logsDir, filename);
    const logEntry = `${datetime}: ${JSON.stringify(state, null, 2)}\n`;
    await fs.appendFile(filePath, logEntry);
    const response = `✅ Current hangout state saved to ${filename}`;
    await services.messageService.sendGroupMessage(response);
    return {
      success: true,
      response,
      shouldRespond: true
    };
  } catch (error) {
    const response = `❌ Failed to save hangout state: ${error.message}`;
    await services.messageService.sendGroupMessage(response);
    return {
      success: false,
      response,
      shouldRespond: true
    };
  }
}

// Attach role level to the function
handleStateCommand.requiredRole = requiredRole;

module.exports = handleStateCommand;