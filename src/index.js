const { messageService } = require('./services/messageService.js');
const pollingService = require('./tasks/pollMessages.js');
const { logger } = require('./lib/logging.js');
const config = require('./config.js');
const parseCommands = require('./services/parseCommands');

// Log application starting
logger.info('=== Application Starting ===');

(async () => {
  try {
    // // go find the latest Hangout Message ID so the Bot doesn't start
    // // processing old messages on startup
    // logger.debug('Retrieving latest group message ID');
    // const latestID = await messageService.returnLatestGroupMessageId();
    // messageService.setLatestGroupMessageId(latestID);
    // logger.info(`Latest group message ID set to: ${latestID || 'null'}`);

    // // ping a message that the Bot has started successfully
    // logger.debug('Sending startup message to group');
    // await messageService.sendGroupMessage("Mr. Roboto version 3 is online");
    // logger.info('Startup message sent successfully');
    
    // // start polling the message service for new messages
    // logger.debug('Starting group message polling');
    // pollingService.startGroupMessagePolling(1000 * 1); // 1000ms * number of seconds for interval
    // logger.info('Group message polling started');
    
    // logger.debug('Starting private message polling');
    // pollingService.startPrivateMessagePolling(1000 * 5)

    // Start polling for unread private user messages every 10 seconds
    setInterval(async () => {
      try {
        const userID = config.COMETCHAT_RECEIVER_UID;
        // Use messageService to fetch all unread messages
        const messages = await messageService.fetchAllPrivateUserMessages(userID);
        if (Array.isArray(messages) && messages.length > 0) {
          // Sort messages by ID ascending
          const sorted = messages.slice().sort((a, b) => Number(a.id) - Number(b.id));
          logger.info(`Unread messages (${sorted.length}):`);
          for (const msg of sorted) {
            logger.info(`- ID: ${msg.id} | Message: "${msg.message}" | Read: ${msg.readAt}`);
            if (parseCommands(msg.message)) {
              await messageService.sendPrivateMessage(`Command received ${msg.message}`, msg.sender);
            }
          }
          // Mark all as read
          await messageService.markAllPrivateUserMessagesAsRead(userID);
        } else {
          logger.info('No unread messages found.');
        }
      } catch (err) {
        logger.error('❌ Error polling unread private user messages:', err.response?.data || err.message);
      }
    }, 5000); // 5 seconds

    logger.info('=== Application Started Successfully ===');

  } catch (err) {
    logger.error('❌ Error during startup:', err.response?.data || err.message);
  }
})();
