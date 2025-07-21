const { messageService } = require('./services/messageService.js');
const pollingService = require('./tasks/pollMessages.js');

(async () => {
  try {
    // await messageService.sendPrivateMessage( "PM from Hello Mr. Roboto version 3!" );
    console.log(`latestID: ${await messageService.returnLatestGroupMessageId()}`);
    await messageService.sendGroupMessage( "Mr. Roboto version 3 is online" );
    pollingService.startGroupMessagePolling(1000 * 1); // 1000ms * number of seconds for interval
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();
