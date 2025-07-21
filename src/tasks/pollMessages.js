const { messageService } = require('../services/messageService.js');

function startPolling(interval = 1000 * 1) { // 1000ms * x seconds to change polling interval
  setInterval(() => {
    messageService.fetchPrivateMessages().catch(console.error);
    messageService.fetchGroupMessages().catch(console.error);
  }, interval);
}

module.exports = {
  startPolling
};
