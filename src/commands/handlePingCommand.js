module.exports = async function handlePingCommand(args, messageService, context) {
  const response = '🏓 Pong! Bot is alive and responding.';
  await messageService.sendGroupMessage(response);
  return {
    success: true,
    response,
    shouldRespond: true
  };
};
