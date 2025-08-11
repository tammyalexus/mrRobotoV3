const { messageService } = require('../services/messageService.js');
const parseCommands = require('../services/parseCommands.js');

function startGroupMessagePolling(interval = 1000) {
  setInterval(async () => {
    try {
      const groupMessages = await messageService.fetchGroupMessages();
      if (groupMessages.length > 0) {
        const sorted = groupMessages.sort((a, b) => a.id - b.id);
        await parseCommands(sorted);
      }
    } catch (err) {
      console.error('❌ Group polling error:', err.message);
    }
  }, interval);
}

function startPrivateMessagePolling(interval = 1000) {
  setInterval(async () => {
    try {
      const privateMessages = await messageService.fetchPrivateMessages();
      if (privateMessages.length > 0) {
        const sorted = privateMessages.sort((a, b) => a.id - b.id);
        console.log(sorted)
      }
    } catch (err) {
      console.error('❌ Private polling error:', err.message);
    }
  }, interval);
}

module.exports = {
  startGroupMessagePolling,
  startPrivateMessagePolling
};
