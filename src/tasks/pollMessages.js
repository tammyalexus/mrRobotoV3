const { messageService } = require('../services/messageService.js');
const parseCommand = require('../services/parseCommands.js');
const { logger } = require('../lib/logging.js');

function startGroupMessagePolling(interval = 1000) {
  setInterval(async () => {
    try {
      const groupMessages = await messageService.fetchGroupMessages();
      if (groupMessages && groupMessages.length > 0) {
        const sorted = groupMessages.sort((a, b) => a.id - b.id);

        // Process each command individually
        logger.debug(`Processing ${sorted.length} commands`);
        let successCount = 0;

        for (const message of sorted) {
          if (message?.data?.text) {
            const result = await parseCommand(message.data.text, message.id);
            if (result) {
              successCount++;
            }
          } else {
            logger.warn('Skipping invalid message format:', message);
          }
        }

        logger.debug(`Command processing complete. Success: ${successCount}/${sorted.length}`);
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
      if (privateMessages && privateMessages.length > 0) {
        const sorted = privateMessages.sort((a, b) => a.id - b.id);
        logger.debug('Private messages received:', sorted);

        // Process each private command individually if needed
        for (const message of sorted) {
          if (message?.data?.text) {
            await parseCommand(message.data.text, message.id);
          }
        }
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
