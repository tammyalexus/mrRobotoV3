const { ServerMessageName, SocketClient, StatefulServerMessageName, StatelessServerMessageName } = require('ttfm-socket');

class Bot {
  constructor(slug, services) {
    this.services = services;
    this.lastMessageIDs = {}
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
      this.services.logger.error('❌ Failed to join room:', joinError);
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
        this.services.logger.error('❌ Reconnection failed:', error);
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
    this.socket.on('statefulMessage', async (payload) => {
      this.services.logger.debug(`statefulMessage - ${payload.name}`);
      // TODO: Add specific handler logic based on payload.name
    });
  }

  _setupStatelessMessageListener() {
    this.socket.on("statelessMessage", (payload) => {
      this.services.logger.debug(`statelessMessage - ${payload.name}`);
      // TODO: Add specific handler logic based on payload.name
    });
  }

  _setupServerMessageListener() {
    this.socket.on("serverMessage", (payload) => {
      this.services.logger.debug(`serverMessage - ${payload.message.name}`);
      // TODO: Add specific handler logic based on payload.message.name
    });
  }

  _setupErrorListener() {
    this.socket.on("error", async (message) => {
      this.services.logger.debug(`Socket error: ${message}`);
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
      this.services.logger.error('Error in processNewMessages:', error);
      throw error;
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
      this.services.config.CHAT_REPLY_ID
    ].filter(Boolean); // Remove any undefined values
    
    return ignoredSenders.includes(sender);
  }

  async _handleMessage(chatMessage, sender, fullMessage) {
    // Process the message using parseCommands
    await this.services.parseCommands(chatMessage);
    
    // TODO: Add additional message handling logic here
    // - Command routing
    // - Response generation
    // - Context management
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
