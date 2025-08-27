const { logger } = require('../lib/logging.js');
const fs = require('fs').promises;
const path = require('path');

// This command requires OWNER role
module.exports.requiredRole = 'OWNER';

/**
 * Changes the bot's nickname and updates all related configurations
 * @param {Object} commandParams Standard command parameters
 * @returns {Promise<Object>} Command result
 */
module.exports = async function handleChangebotnameCommand(commandParams) {
  const { args, services, context } = commandParams;

  if (!args) {
    const response = '❌ Please provide a new name for the bot.';
    await services.messageService.sendGroupMessage(response, { services });
    return {
      success: false,
      shouldRespond: true,
      response
    };
  }

  try {
    // 1. Update the nickname in TT.fm
    await services.hangUserService.updateHangNickname(args);

    // 2. Update CHAT_NAME in the data service (this will also update the file)
    await services.dataService.setValue('botData.CHAT_NAME', args);

    const response = `✅ Bot name successfully changed to: ${args}`;
    await services.messageService.sendGroupMessage(response, { services });

    return {
      success: true,
      shouldRespond: true,
      response
    };

  } catch (error) {
    const errorMsg = `❌ Failed to change bot name: ${error.message}`;
    logger.error(`Error in changeBotName command: ${error.message}`);
    await services.messageService.sendGroupMessage(errorMsg, { services });

    return {
      success: false,
      shouldRespond: true,
      error: error.message,
      response: errorMsg
    };
  }
};
