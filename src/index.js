const { sendPrivateMessage, sendGroupMessage } = require('./services/messageService.js');
const { startPolling } = require('./tasks/pollMessages.js');

(async () => {
  try {
    await sendPrivateMessage( "PM from Hello Mr. Roboto version 3!" );
    await sendGroupMessage( "Message from Hello Mr. Roboto version 3!" );
    startPolling(5000);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();
