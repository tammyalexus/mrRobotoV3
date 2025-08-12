const { messageService } = require('../services/messageService.js');
const parseCommands = require('../services/parseCommands.js');
const { logger } = require('../lib/logging.js');

function startGroupMessagePolling(interval = 1000) {
  setInterval(async () => {
    try {
      const groupMessages = await messageService.fetchGroupMessages();
      if (groupMessages.length > 0) {
        const sorted = groupMessages.sort((a, b) => a.id - b.id);
        await parseCommands(sorted);
      }
    } catch (err) {
      logger.error('❌ Group polling error:', err.message);
    }
  }, interval);
}

function startPrivateMessagePolling(interval = 1000) {
  setInterval(async () => {
    try {
      const privateMessages = await messageService.fetchPrivateMessages();
      if (privateMessages.length > 0) {
        const sorted = privateMessages.sort((a, b) => a.id - b.id);
        logger.debug('Private messages received:', sorted);
      }
    } catch (err) {
      logger.error('❌ Private polling error:', err.message);
    }
  }, interval);
}

module.exports = {
  startGroupMessagePolling,
  startPrivateMessagePolling
};
