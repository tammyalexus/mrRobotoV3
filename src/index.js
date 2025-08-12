const { messageService } = require('./services/messageService.js');
const pollingService = require('./tasks/pollMessages.js');
const { logger } = require('./lib/logging.js');

// Log application starting
logger.info('=== Application Starting ===');

(async () => {
  try {
    // go find the latest Hangout Message ID so the Bot doesn't start
    // processing old messages on startup
    // logger.debug('Retrieving latest group message ID');
    // const latestID = await messageService.returnLatestGroupMessageId();
    // messageService.setLatestGroupMessageId(latestID);
    // logger.info(`Latest group message ID set to: ${latestID || 'null'}`);

    // // ping a message that the Bot has started successfully
    // logger.debug('Sending startup message to group');
    // await messageService.sendGroupMessage("Mr. Roboto version 3 is online");
    // logger.info('Startup message sent successfully');
    //
    // // start polling the message service for new messages
    // logger.debug('Starting group message polling');
    // pollingService.startGroupMessagePolling(1000 * 1); // 1000ms * number of seconds for interval
    // logger.info('Group message polling started');
    //
    logger.debug('Starting private message polling');
    //pollingService.startPrivateMessagePolling(1000 * 5)
    await messageService.fetchAllUserMessages();

    // logger.debug('Updating message interraction status');
    // await messageService.markMessageAsInterracted( );

    logger.info('=== Application Started Successfully ===');

    // logger.debug('Retrieving group members');
    // await messageService.listGroupMembers();

  } catch (err) {
    logger.error('❌ Error during startup:', err.response?.data || err.message);
  }
})();
