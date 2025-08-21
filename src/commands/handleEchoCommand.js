module.exports = async function handleEchoCommand(args, messageService, hangUserService, context) {
  if (!args.trim()) {
    const response = '❓ Echo what? Please provide a message to echo.';
    await messageService.sendGroupMessage(response);
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
  await messageService.sendGroupMessage(response);
  return {
    success: true,
    response,
    shouldRespond: true
  };
};
