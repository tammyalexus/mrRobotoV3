const services = require( './services/serviceContainer.js' );
const { Bot } = require( './lib/bot.js' );
const { Chain } = require( 'repeat' );

process.on( 'unhandledRejection', ( reason, promise ) => {
  services.logger.error( `Unhandled Rejection at: ${ promise }, reason: ${ reason }` );
} );

// Log application starting
services.logger.info( '======================================= Application Starting =======================================' );

( async () => {

  try {
    // Fetch bot's nickname using BOT_UID and hangUserService
    try {
      const botNickname = await services.hangUserService.getUserNicknameByUuid( services.config.BOT_UID );
      services.setState( 'botNickname', botNickname );
      services.logger.info( `🤖 Bot nickname resolved and stored: ${ botNickname }` );
    } catch ( err ) {
      services.logger.warn( `⚠️ Could not resolve bot nickname: ${ err.message }` );
    }

    const roomBot = new Bot( services.config.HANGOUT_ID, services );
    services.logger.debug( '🤖 Bot instance created' );

    try {
      await roomBot.connect();
      services.logger.debug( '✅ Bot connect() completed successfully' );
    } catch ( connectError ) {
      services.logger.error( `❌ Error during bot.connect(): ${ connectError }` );
      throw connectError;
    }

    // Join the chat group before processing messages
    try {
      services.logger.debug( '🔄 Joining chat group...' );
      await services.messageService.joinChat( services.config.HANGOUT_ID );
      services.logger.debug( '✅ Successfully joined chat group' );
    } catch ( joinError ) {
      services.logger.error( `❌ Error joining chat group: ${ joinError }` );
      // Don't throw here - continue with limited functionality
      services.logger.warn( '⚠️ Continuing without group membership - some features may not work' );
    }

    const checkInterval = 1000 * 1; // 1 second
    try {
      const repeatedTasks = new Chain();
      repeatedTasks
        .add( async () => {
          try {
            await roomBot.processNewMessages();
          } catch ( error ) {
            services.logger.error( `Error in processNewMessages: ${ error?.message || error?.toString() || 'Unknown error' }` );
          }
        } )
        .every( checkInterval ) // every 1 second

      services.logger.debug( `Started message processing chain with ${ checkInterval }ms interval` );
    } catch ( chainError ) {
      services.logger.error( `Error starting message processing chain: ${ chainError }` );
      // Fallback to setInterval if Chain fails
      services.logger.info( 'Falling back to setInterval for message processing' );
      setInterval( async () => {
        try {
          await roomBot.processNewMessages();
        } catch ( error ) {
          services.logger.error( `Error in processNewMessages (fallback): ${ error?.message || error?.toString() || 'Unknown error' }` );
        }
      }, checkInterval );
    }

    services.logger.info( '======================================= Application Started Successfully =======================================' );

    // Send startup message to group
    try {
      const botNickname = services.getState( 'botNickname' ) || 'Bot';
      await services.messageService.sendGroupMessage( `${ botNickname } is online...user ${ services.config.COMMAND_SWITCH }help to see some of what I can do` );
      services.logger.info( "✅ Startup message sent to group" );
    } catch ( error ) {
      services.logger.error( `❌ Failed to send startup message: ${ error?.message || error?.toString() || 'Unknown error' }` );
    }

  } catch ( err ) {
    services.logger.error( `❌ Error during startup: ${ err.response?.data || err.message }` );
    services.logger.error( err );
  }
} )();
