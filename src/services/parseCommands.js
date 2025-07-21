function parseCommands(messages) {
  for (const msg of messages) {
    console.log(`⚙️ Parsing command: ${msg.data.text}`);
    // Add your command parsing and execution logic here
  }
}

module.exports = parseCommands;
