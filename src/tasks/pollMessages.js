const { fetchPrivateMessages, fetchGroupMessages } = require('../services/messageService.js');

function startPolling(interval = 5000) {
  setInterval(() => {
    fetchPrivateMessages().catch(console.error);
    fetchGroupMessages().catch(console.error);
  }, interval);
}

module.exports = {
  startPolling
};
