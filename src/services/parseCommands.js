const config = require('../config.js');

/**
 * Checks if a command string starts with the COMMAND_SWITCH character
 * @param {string} commandText - The command string to process
 * @returns {boolean} True if first character matches COMMAND_SWITCH, false otherwise
 */
function parseCommands(commandText) {
  if (typeof commandText !== 'string' || !commandText.trim().length) {
    return false;
  }
  return commandText.trim().charAt(0) === config.COMMAND_SWITCH;
}

module.exports = parseCommands;
