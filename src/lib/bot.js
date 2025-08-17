const { ServerMessageName, SocketClient, StatefulServerMessageName, StatelessServerMessageName } = require('ttfm-socket');

class Bot {
  constructor(slug, services) {
    this.services = services;
    this.lastMessageIDs = {}
  }

  // ========================================================
  // Connection functions
  // ========================================================

  // async connect( roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions ) {
  async connect() {
    this.services.logger.debug('Joining the chat...')
    await this.services.messageService.joinChat(this.services.config.HANGOUT_ID)

    this.services.logger.debug('Creating SocketClient...')
    this.socket = new SocketClient('https://socket.prod.tt.fm')
    this.services.logger.debug('✅ SocketClient created');

    // Add timeout to socket join operation
    const joinRoomWithTimeout = async () => {
      return Promise.race([
        this.socket.joinRoom(this.services.config.BOT_USER_TOKEN, {
          roomUuid: this.services.config.HANGOUT_ID
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Socket join room timeout after 10 seconds')), 10000)
        )
      ]);
    };

    try {
      this.services.logger.debug('Joining rooom...')
      const connection = await joinRoomWithTimeout();
      this.services.logger.debug('✅ Room joined successfully, setting up state...');
      this.state = connection.state;
    } catch (joinError) {
      this.services.logger.error('❌ Failed to join room:', joinError);
      throw joinError;
    }

    this.services.logger.debug('✅ Setting up reconnect handler...');
    this.socket.on("reconnect", async () => {
      this.services.logger.debug('🔄 Reconnecting to room...');
      const { state } = await this.socket.joinRoom(this.services.config.BOT_USER_TOKEN, {
        roomUuid: this.services.config.HANGOUT_ID
      });
      this.state = connection.state
      this.services.logger.debug('🔄 Reconnected successfully');
    });
    // await startup( process.env.ROOM_UUID, this.state, roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions )
  }

  configureListeners() {
    this.services.logger.debug('Setting up listeners')

    this.socket.on('statefulMessage', async payload => {
      this.services.logger.debug(`statefulMessage - ${payload.name} -------------------------------------------`)
      this.services.logger.debug(`error ${payload.message}`)
    })

    this.socket.on("statelessMessage", (payload) => {
      this.services.logger.debug(`statelessMessage - ${payload.name} -------------------------------------------`)
      this.services.logger.debug(`error ${payload.message}`)

    });

    this.socket.on("serverMessage", (payload) => {
      this.services.logger.debug(`serverMessage - ${payload.message.name} -------------------------------------------`)
      this.services.logger.debug(`error ${payload.message}`)
    });

    this.socket.on("error", async (message) => {
      this.services.logger.debug(`error --------------------------------------------`)
      this.services.logger.debug(`error ${message}`)
    });
  }

  async processNewMessages() {
    const messages = await this.services.messageService.fetchGroupMessages(this.services.config.HANGOUT_ID, {
      fromTimestamp: this.lastMessageIDs?.fromTimestamp,
      lastID: this.lastMessageIDs?.id,
      filterCommands: false // Get all messages, not just commands
    });

    if (messages?.length) {
      for (const message of messages) {
        this.services.updateLastMessageId(message.id);
        this.lastMessageIDs.fromTimestamp = message.sentAt + 1;
        this.lastMessageIDs.id = message.id;

        const chatMessage = message?.data?.metadata?.chatMessage?.message ?? '';

        if (!chatMessage) continue;
        const sender = message?.sender ?? '';
        if ([this.services.config.BOT_UID, this.services.config.CHAT_REPLY_ID].includes(sender)) continue;

        this.services.logger.debug(`Processing message: "${chatMessage}" from ${sender}`);

        // Process the message using parseCommands
        await this.services.parseCommands(chatMessage);
      }
    }
  }

}

module.exports = { Bot };
