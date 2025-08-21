const config = require('../config.js');

module.exports = async function handleHelpCommand(args, messageService, context) {
  const helpText = `🤖 Available Commands:\n${config.COMMAND_SWITCH}help - Show this help message\n${config.COMMAND_SWITCH}ping - Check if bot is responding\n${config.COMMAND_SWITCH}status - Show bot status\n${config.COMMAND_SWITCH}echo [message] - Echo back your message`;
  await messageService.sendGroupMessage(helpText);
  return {
    success: true,
    response: helpText,
    shouldRespond: true
  };
};
