const { messageService } = require('../services/messageService.js');
async function parseCommands(messages) {
  for (const msg of messages) {
    console.log(`⚙️ Parsing command: ${msg.data.text}`);
    await messageService.sendGroupMessage(`I heard the command ${msg.data.text}`);
  }
}

module.exports = parseCommands;
