const { sendPrivateMessage, sendGroupMessage } = require('./services/messageService.js');
const { startPolling } = require('./tasks/pollMessages.js');

(async () => {
  try {
    await sendPrivateMessage();
    await sendGroupMessage();
    startPolling(5000);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();
