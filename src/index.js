const services = require('./services/serviceContainer.js');
const { Bot } = require('./lib/bot.js');
const { Chain } = require('repeat');

process.on('unhandledRejection', (reason, promise) => {
  services.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log application starting
services.logger.info('======================================= Application Starting =======================================');

(async () => {
  try {
    const roomBot = new Bot(services.config.HANGOUT_ID, services);
    services.logger.debug('🤖 Bot instance created');

    try {
      await roomBot.connect();
      services.logger.debug('✅ Bot connect() completed successfully');
    } catch (connectError) {
      services.logger.error('❌ Error during bot.connect():', connectError);
      throw connectError;
    }
    
    try {
      roomBot.configureListeners();
      services.logger.debug('✅ Listeners configured successfully');
    } catch (listenerError) {
      services.logger.error('❌ Error during configureListeners():', listenerError);
      throw listenerError;
    }

    const checkInterval = 1000 * 1; // 1 second
    try {
      const repeatedTasks = new Chain();
      repeatedTasks
        .add(async () => {
          try {
            await roomBot.processNewMessages();
          } catch (error) {
            services.logger.error('Error in processNewMessages:', error);
          }
        })
        .every( checkInterval ) // every 1 second
        
      services.logger.debug('Started message processing chain with 100ms interval');
    } catch (chainError) {
      services.logger.error('Error starting message processing chain:', chainError);
      // Fallback to setInterval if Chain fails
      services.logger.info('Falling back to setInterval for message processing');
      setInterval(async () => {
        try {
          await roomBot.processNewMessages();
        } catch (error) {
          services.logger.error('Error in processNewMessages (fallback):', error);
        }
      }, checkInterval );
    }      
      
      // start polling the message service for new messages
      // services.logger.debug('Starting group message polling');
      // services.pollingService.startGroupMessagePolling(1000 * 1); // 1000ms * number of seconds for interval
      // services.logger.info('Group message polling started');

      // services.logger.debug('Starting private message polling');
      // services.pollingService.startPrivateMessagePolling(1000 * 5)

      // =========================================================
      // WORKS BELOW THE LINE
      // =========================================================

      // can send messages in public chat
      // services.logger.debug('Sending startup message to group');
      // await services.messageService.sendGroupMessage("Mr. Roboto version 3 is online");
      // services.logger.info('Startup message sent successfully');

      // go find the latest Hangout Message ID so the Bot doesn't start
      // processing old messages on startup
      // services.logger.debug('Retrieving latest group message ID');
      // const latestID = await services.messageService.returnLatestGroupMessageId();
      // services.messageService.setLatestGroupMessageId(latestID);
      // services.logger.info(`Latest group message ID set to: ${latestID || 'null'}`);

      // find all users in the CometChat group
      // await services.messageService.listGroupMembers()

      // Start polling for unread private user messages every 10 seconds
      // setInterval(async () => {
      //   try {
      //     const userID = services.config.COMETCHAT_RECEIVER_UID;
      //     // Use messageService to fetch all unread messages
      //     const messages = await services.messageService.fetchAllPrivateUserMessages(userID);
      //     if (Array.isArray(messages) && messages.length > 0) {
      //       // Sort messages by ID ascending
      //       const sorted = messages.slice().sort((a, b) => Number(a.id) - Number(b.id));
      //       services.logger.info(`Unread messages (${sorted.length}):`);
      //       for (const msg of sorted) {
      //         services.logger.info(`- ID: ${msg.id} | Message: "${msg.message}" | Read: ${msg.readAt}`);
      //         if (await services.parseCommands( msg.message )) {
      //           await services.messageService.sendPrivateMessage(`Command received ${msg.message}`, msg.sender);
      //         }
      //       }
      //       // Mark all as read
      //       await services.messageService.markAllPrivateUserMessagesAsRead(userID);
      //     } else {
      //       services.logger.info('No unread messages found.');
      //     }
      //   } catch (err) {
      //     services.logger.error('❌ Error polling unread private user messages:', err.response?.data || err.message);
      //   }
      // }, 5000); // 5 seconds

    services.logger.info(`🚀 Bot is now running and processing messages every ${checkInterval} ms`);
    services.logger.info('======================================= Application Started Successfully =======================================');
    
  } catch (err) {
    services.logger.error('❌ Error during startup:', err.response?.data || err.message);
    services.logger.error(err);
  }
})();
