const services = require('../services/serviceContainer.js');

function startGroupMessagePolling(interval = 1000) {
  setInterval(async () => {
    try {
      const groupMessages = await services.messageService.fetchGroupMessages();
      if (groupMessages && groupMessages.length > 0) {
        const sorted = groupMessages.sort((a, b) => a.id - b.id);

        // Process each command individually
        services.logger.debug(`Processing ${sorted.length} commands`);
        let successCount = 0;

        for (const message of sorted) {
          if (message?.data?.text) {
            const result = await services.parseCommands(message.data.text);
            if (result) {
              successCount++;
            }
          } else {
            services.logger.warn(`Skipping invalid message format: ${message}`);
          }
        }

        services.logger.debug(`Command processing complete. Success: ${successCount}/${sorted.length}`);
      }
    } catch (err) {
      services.logger.error(`❌ Group polling error: ${err.message}`);
    }
  }, interval);
}

function startPrivateMessagePolling(interval = 1000) {
  setInterval(async () => {
    try {
      const privateMessages = await services.messageService.fetchPrivateMessages();
      if (privateMessages && privateMessages.length > 0) {
        const sorted = privateMessages.sort((a, b) => a.id - b.id);
        services.logger.debug(`Private messages received: ${sorted}`);

        // Process each private command individually if needed
        for (const message of sorted) {
          if (message?.data?.text) {
            await services.parseCommands(message.data.text, message.id);
          }
        }
      }
    } catch (err) {
      services.logger.error(`❌ Private polling error: ${err.message}`);
    }
  }, interval);
}

module.exports = {
  startGroupMessagePolling,
  startPrivateMessagePolling
};
