const { messageService } = require('./services/messageService.js');
const pollingService = require('./tasks/pollMessages.js');
const { logger } = require('./utils/logging.js');

(async () => {
  try {
    // await messageService.sendPrivateMessage( "PM from Hello Mr. Roboto version 3!" );

    await messageService.listGroupMembers()

    // go find the latest Hangout Message ID so the Bot doesn't start
    // processing old messages on startup
    const latestID = await messageService.returnLatestGroupMessageId();
    messageService.setLatestGroupMessageId( latestID );

    // ping a message that the Bot has started successfully
    await messageService.sendGroupMessage( "Mr. Roboto version 3 is online" );

    // start polling the message service for new messages
    pollingService.startGroupMessagePolling( 1000 * 1 ); // 1000ms * number of seconds for interval

    pollingService.startPrivateMessagePolling( 1000 * 5 )
  } catch (err) {
    logger.error('❌ Error:', err.response?.data || err.message);
  }
})();
