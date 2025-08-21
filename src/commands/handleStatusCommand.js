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

module.exports = async function handleStatusCommand(args, messageService, context) {
  const uptime = process.uptime();
  const uptimeFormatted = formatUptime(uptime);
  const response = `🤖 Bot Status:\n✅ Online and operational\n⏱️ Uptime: ${uptimeFormatted}`;
  await messageService.sendGroupMessage(response);
  return {
    success: true,
    response,
    shouldRespond: true
  };
};
