const { messageService } = require('./services/messageService.js');
const { startPolling } = require('./tasks/pollMessages.js');

(async () => {
  try {
    // await messageService.sendPrivateMessage( "PM from Hello Mr. Roboto version 3!" );
    await messageService.sendGroupMessage( "Mr. Roboto version 3 is online" );
    startPolling(5000);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();
