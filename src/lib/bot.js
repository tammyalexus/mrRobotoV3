const { ServerMessageName, SocketClient, StatefulServerMessageName, StatelessServerMessageName } = require('ttfm-socket');
const { applyPatch } = require('fast-json-patch');
const fs = require('fs').promises;
const path = require('path');

class Bot {
  constructor(slug, services) {
    this.services = services;
    this.lastMessageIDs = {}
  }

  // ========================================================
  // Socket Message File Logging Helper
  // ========================================================

  async _writeSocketMessagesToLogFile(filename, data) {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      const filePath = path.join(logsDir, filename);
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp}: ${JSON.stringify(data, null, 2)}\n`;
      
      await fs.appendFile(filePath, logEntry);
    } catch (error) {
      this.services.logger.error(`Failed to write to log file ${filename}: ${error.message}`);
    }
  }

  // ========================================================
  // Main Connection Flow
  // ========================================================

  async connect() {
    await this._joinCometChat();
    await this._createSocketConnection();
    await this._joinSocketRoom();
    this._setupReconnectHandler();
  }

  // ========================================================
  // Connection Helper Functions
  // ========================================================

  async _joinCometChat() {
    this.services.logger.debug('Joining the chat...');
    await this.services.messageService.joinChat(this.services.config.HANGOUT_ID);
  }

  async _createSocketConnection() {
    this.services.logger.debug('Creating SocketClient...');
    this.socket = new SocketClient('https://socket.prod.tt.fm');
    this.services.logger.debug('✅ SocketClient created');
  }

  async _joinSocketRoom() {
    this.services.logger.debug('Joining room...');
    
    try {
      const connection = await this._joinRoomWithTimeout();
      this.services.logger.debug('✅ Room joined successfully, setting up state...');
      this.state = connection.state;
    } catch (joinError) {
      this.services.logger.error(`❌ Failed to join room: ${joinError}`);
      throw joinError;
    }
  }

  async _joinRoomWithTimeout() {
    const timeoutMs = 10000;
    
    return Promise.race([
      this.socket.joinRoom(this.services.config.BOT_USER_TOKEN, {
        roomUuid: this.services.config.HANGOUT_ID
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Socket join room timeout after ${timeoutMs/1000} seconds`)), timeoutMs)
      )
    ]);
  }

  _setupReconnectHandler() {
    this.services.logger.debug('✅ Setting up reconnect handler...');
    
    this.socket.on("reconnect", async () => {
      this.services.logger.debug('🔄 Reconnecting to room...');
      try {
        const { state } = await this.socket.joinRoom(this.services.config.BOT_USER_TOKEN, {
          roomUuid: this.services.config.HANGOUT_ID
        });
        this.state = state; // Fixed: was using 'connection.state' instead of 'state'
        this.services.logger.debug('🔄 Reconnected successfully');
      } catch (error) {
        this.services.logger.error(`❌ Reconnection failed: ${error}`);
      }
    });
  }

  // ========================================================
  // Listener Configuration
  // ========================================================

  configureListeners() {
    this.services.logger.debug('Setting up listeners');
    
    this._setupStatefulMessageListener();
    this._setupStatelessMessageListener();
    this._setupServerMessageListener();
    this._setupErrorListener();
  }

  _setupStatefulMessageListener() {
    this.socket.on('statefulMessage', async (message) => {
      this.services.logger.debug(`statefulMessage - ${message.name}`);
      
      // Log payload to file
      await this._writeSocketMessagesToLogFile('statefulMessage.log', message);
      
      // Apply state patch to update current state
      if (message.statePatch && this.state) {
        try {
          const patchResult = applyPatch(
            this.state,
            message.statePatch,
            true,  // validate operation
            false  // mutate document
          );
          
          // Update the bot's state with the patched state
          this.state = patchResult.newDocument;
          
          this.services.logger.debug(`State updated via patch for message: ${message.name}`);
          this.services.logger.debug(`Applied ${message.statePatch.length} patch operations`);
        } catch (error) {
          this.services.logger.error(`Failed to apply state patch for ${message.name}: ${error.message}`);
          // Continue execution even if patch fails to avoid breaking the bot
        }
      } else if (message.statePatch && !this.state) {
        this.services.logger.warn(`Received state patch but no current state available for message: ${message.name}`);
      }
      
      // TODO: Add specific handler logic based on message.name
      // This could include handling specific events like song changes, user actions, etc.
    });
  }

  _setupStatelessMessageListener() {
    this.socket.on("statelessMessage", async (payload) => {
      this.services.logger.debug(`statelessMessage - ${payload.name}`);
      
      // Log payload to file
      await this._writeSocketMessagesToLogFile('statelessMessage.log', payload);
      
      // TODO: Add specific handler logic based on payload.name
    });
  }

  _setupServerMessageListener() {
    this.socket.on("serverMessage", async (payload) => {
      this.services.logger.debug(`serverMessage - ${payload.message.name}`);
      
      // Log payload to file
      await this._writeSocketMessagesToLogFile('serverMessage.log', payload);
      
      // TODO: Add specific handler logic based on payload.message.name
    });
  }

  _setupErrorListener() {
    this.socket.on("error", async (message) => {
      this.services.logger.debug(`Socket error: ${message}`);
      
      // Log message to file
      await this._writeSocketMessagesToLogFile('socketError.log', { error: message, timestamp: new Date().toISOString() });
      
      // TODO: Add specific error handling logic
    });
  }

  // ========================================================
  // Message Processing
  // ========================================================

  async processNewMessages() {
    try {
      const messages = await this._fetchNewMessages();
      
      if (!messages?.length) {
        return; // No new messages to process
      }

      await this._processMessageBatch(messages);
    } catch (error) {
      // More defensive error handling
      const errorMessage = error && typeof error === 'object' 
        ? (error.message || error.toString() || 'Unknown error object')
        : (error || 'Unknown error');
      
      this.services.logger.error(`Error in processNewMessages: ${errorMessage}`);
      
      if (error && error.stack) {
        this.services.logger.error(`Error stack: ${error.stack}`);
      }
    }
  }

  async _fetchNewMessages() {
    return await this.services.messageService.fetchGroupMessages(this.services.config.HANGOUT_ID, {
      fromTimestamp: this.lastMessageIDs?.fromTimestamp,
      lastID: this.lastMessageIDs?.id,
      filterCommands: false // Get all messages, not just commands
    });
  }

  async _processMessageBatch(messages) {
    for (const message of messages) {
      await this._processSingleMessage(message);
    }
  }

  async _processSingleMessage(message) {
    this._updateMessageTracking(message);
    
    const chatMessage = this._extractChatMessage(message);
    if (!chatMessage) return;

    const sender = message?.sender ?? '';
    if (this._shouldIgnoreMessage(sender)) return;

    this.services.logger.debug(`Processing message: "${chatMessage}" from ${sender}`);
    
    await this._handleMessage(chatMessage, sender, message);
  }

  _updateMessageTracking(message) {
    this.services.updateLastMessageId(message.id);
    this.lastMessageIDs.fromTimestamp = message.sentAt + 1;
    this.lastMessageIDs.id = message.id;
  }

  _extractChatMessage(message) {
    return message?.data?.metadata?.chatMessage?.message ?? '';
  }

  _shouldIgnoreMessage(sender) {
    const ignoredSenders = [
      this.services.config.BOT_UID,
      // this.services.config.CHAT_REPLY_ID // Not defined in .env file
    ].filter(Boolean); // Remove any undefined values
    
    return ignoredSenders.includes(sender);
  }

  async _handleMessage(chatMessage, sender, fullMessage) {
    try {
      // Check if parseCommands exists and is a function
      if (typeof this.services.parseCommands === 'function') {
        const parseResult = await this.services.parseCommands(chatMessage, this.services);
        this.services.logger.debug(`parseCommands result: ${JSON.stringify(parseResult)}`);
        
        // If it's a command, process it with commandService
        if (parseResult && parseResult.isCommand) {
          this.services.logger.debug(`Command detected: "${parseResult.command}" with remainder: "${parseResult.remainder}"`);
          
          // Check if commandService exists and is a function
          if (typeof this.services.commandService === 'function') {
            const context = {
              sender,
              fullMessage,
              chatMessage
            };
            
            const commandResult = await this.services.commandService(
              parseResult.command,
              parseResult.remainder,
              this.services,
              context
            );
            
            this.services.logger.debug(`Command processed: ${JSON.stringify(commandResult)}`);
          } else {
            this.services.logger.warn(`commandService is not available: ${typeof this.services.commandService}`);
          }
        }
      } else {
        this.services.logger.warn(`parseCommands is not a function: ${typeof this.services.parseCommands}`);
      }
      
      // TODO: Add additional message handling logic here
      // - Non-command message processing
      // - Context management
    } catch (error) {
      // More defensive error handling
      const errorMessage = error && typeof error === 'object' 
        ? (error.message || error.toString() || 'Unknown error object')
        : (error || 'Unknown error');
      
      this.services.logger.error(`Error in _handleMessage: ${errorMessage}`);
      
      if (error && error.stack) {
        this.services.logger.error(`Error stack: ${error.stack}`);
      }
      
      throw error; // Re-throw so processNewMessages can catch it
    }
  }

  // ========================================================
  // Utility Methods
  // ========================================================

  getConnectionStatus() {
    return {
      isConnected: !!this.socket,
      hasState: !!this.state,
      lastMessageId: this.lastMessageIDs?.id,
      lastTimestamp: this.lastMessageIDs?.fromTimestamp
    };
  }

  async disconnect() {
    this.services.logger.debug('Disconnecting bot...');
    
    if (this.socket) {
      // TODO: Add proper socket cleanup
      this.socket = null;
    }
    
    this.state = null;
    this.services.logger.debug('✅ Bot disconnected');
  }
}

module.exports = { Bot };
