// Set required role level for this command
const requiredRole = 'USER';

/**
 * Echoes a message back to the chat
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @param {string} commandParams.responseChannel - Response channel ('public' or 'request')
 * @returns {Promise<Object>} Command result
 */
async function handleEchoCommand(commandParams) {
  const { args, services, context, responseChannel = 'request' } = commandParams;
  const { messageService, hangUserService } = services;
  if (!args.trim()) {
    const response = '❓ Echo what? Please provide a message to echo.';
    await messageService.sendResponse(response, {
      responseChannel,
      isPrivateMessage: context?.fullMessage?.isPrivateMessage,
      sender: context?.sender,
      services
    });
    return {
      success: false,
      response,
      shouldRespond: true
    };
  }
  const senderUuid = context && typeof context.sender === 'string' && context.sender.trim().length
    ? context.sender
    : null;
  let senderDisplay = 'unknown';
  if (senderUuid && hangUserService && typeof hangUserService.getUserNicknameByUuid === 'function') {
    try {
      const nickname = await hangUserService.getUserNicknameByUuid(senderUuid);
      if (nickname && typeof nickname === 'string') {
        senderDisplay = nickname;
      }
    } catch (e) {
      // Swallow lookup errors; keep 'unknown'
    }
  }
  const response = `🔊 Echo: ${args} (from ${senderDisplay})`;
  await messageService.sendResponse(response, {
    responseChannel,
    isPrivateMessage: context?.fullMessage?.isPrivateMessage,
    sender: context?.sender,
    services
  });
  return {
    success: true,
    response,
    shouldRespond: true
  };
}

// Attach role level to the function
handleEchoCommand.requiredRole = requiredRole;

module.exports = handleEchoCommand;
