const config = require('../config.js');

module.exports = async function handleUnknownCommand(command, args, messageService, context) {
  const response = `❓ Unknown command: "${command}". Type ${config.COMMAND_SWITCH}help for available commands.`;
  await messageService.sendGroupMessage(response);
  return {
    success: false,
    response,
    shouldRespond: true,
    error: 'Unknown command'
  };
};
