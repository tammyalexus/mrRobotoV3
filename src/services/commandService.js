const { logger } = require( '../lib/logging.js' );
const config = require( '../config.js' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );

/**
 * Processes bot commands and generates appropriate responses
 * @param {string} command - The command name (without the command switch)
 * @param {string} messageRemainder - The rest of the message after the command
 * @param {Object} services - Services container with messageService, etc.
 * @param {Object} context - Additional context (sender, fullMessage, etc.)
 * @returns {Promise<Object>} Result object with success status and response
 */
async function processCommand ( command, messageRemainder, services = null, context = {} ) {
  // Fallback to direct imports if services not provided
  const messageService = services?.messageService || require( './messageService.js' ).messageService;
  const hangUserService = services?.hangUserService || require( './hangUserService.js' );

  try {
    const trimmedCommand = command.trim().toLowerCase();
    const args = messageRemainder.trim();

    logger.debug( `Processing command: "${ trimmedCommand }" with args: "${ args }"` );

    // Command routing
    switch ( trimmedCommand ) {
      case 'help':
        return await handleHelpCommand( args, messageService, context );

      case 'ping':
        return await handlePingCommand( args, messageService, context );

      case 'status':
        return await handleStatusCommand( args, messageService, context );

      case 'echo':
        return await handleEchoCommand( args, messageService, hangUserService, context );

      case 'state':
        return await handleStateCommand( services, context );

      // Add more commands here as needed
      default:
        return await handleUnknownCommand( trimmedCommand, args, messageService, context );
    }
    // ...existing code...

    async function handleStateCommand ( services, context ) {
      try {
        const state = services?.bot?.state || null;
        if ( !state ) {
          const response = '⚠️ No hangout state available to save.';
          await services.messageService.sendGroupMessage( response );
          return {
            success: false,
            response,
            shouldRespond: true
          };
        }
        const logsDir = path.join( process.cwd(), 'logs' );
        const datetime = new Date().toISOString().replace( /[:.]/g, '-' );
        const filename = `currentState_${ datetime }.log`;
        const filePath = path.join( logsDir, filename );
        const logEntry = `${ datetime }: ${ JSON.stringify( state, null, 2 ) }\n`;
        await fs.appendFile( filePath, logEntry );
        const response = `✅ Current hangout state saved to ${ filename }`;
        await services.messageService.sendGroupMessage( response );
        return {
          success: true,
          response,
          shouldRespond: true
        };
      } catch ( error ) {
        const response = `❌ Failed to save hangout state: ${ error.message }`;
        await services.messageService.sendGroupMessage( response );
        return {
          success: false,
          response,
          shouldRespond: true
        };
      }
    }

  } catch ( error ) {
    const errorMessage = error && typeof error === 'object'
      ? ( error.message || error.toString() || 'Unknown error object' )
      : ( error || 'Unknown error' );

    logger.error( `Failed to process command "${ command }": ${ errorMessage }` );

    return {
      success: false,
      error: errorMessage,
      shouldRespond: false
    };
  }
}

// Command handlers

async function handleHelpCommand ( args, messageService, context ) {
  const helpText = `🤖 Available Commands:
${ config.COMMAND_SWITCH }help - Show this help message
${ config.COMMAND_SWITCH }ping - Check if bot is responding
${ config.COMMAND_SWITCH }status - Show bot status
${ config.COMMAND_SWITCH }echo [message] - Echo back your message`;

  await messageService.sendGroupMessage( helpText );

  return {
    success: true,
    response: helpText,
    shouldRespond: true
  };
}

async function handlePingCommand ( args, messageService, context ) {
  const response = '🏓 Pong! Bot is alive and responding.';

  await messageService.sendGroupMessage( response );

  return {
    success: true,
    response: response,
    shouldRespond: true
  };
}

async function handleStatusCommand ( args, messageService, context ) {
  const uptime = process.uptime();
  const uptimeFormatted = formatUptime( uptime );

  const response = `🤖 Bot Status:
✅ Online and operational
⏱️ Uptime: ${ uptimeFormatted }`;

  await messageService.sendGroupMessage( response );

  return {
    success: true,
    response: response,
    shouldRespond: true
  };
}

async function handleEchoCommand ( args, messageService, hangUserService, context ) {
  if ( !args.trim() ) {
    const response = '❓ Echo what? Please provide a message to echo.';
    await messageService.sendGroupMessage( response );
    return {
      success: false,
      response: response,
      shouldRespond: true
    };
  }

  const senderUuid = context && typeof context.sender === 'string' && context.sender.trim().length
    ? context.sender
    : null;
  let senderDisplay = 'unknown';
  if ( senderUuid && hangUserService && typeof hangUserService.getUserNicknameByUuid === 'function' ) {
    try {
      const nickname = await hangUserService.getUserNicknameByUuid( senderUuid );
      if ( nickname && typeof nickname === 'string' ) {
        senderDisplay = nickname;
      }
    } catch ( e ) {
      // Swallow lookup errors; keep 'unknown'
    }
  }
  const response = `🔊 Echo: ${ args } (from ${ senderDisplay })`;
  await messageService.sendGroupMessage( response );

  return {
    success: true,
    response: response,
    shouldRespond: true
  };
}

async function handleUnknownCommand ( command, args, messageService, context ) {
  const response = `❓ Unknown command: "${ command }". Type ${ config.COMMAND_SWITCH }help for available commands.`;

  await messageService.sendGroupMessage( response );

  return {
    success: false,
    response: response,
    shouldRespond: true,
    error: 'Unknown command'
  };
}

// Utility functions

function formatUptime ( seconds ) {
  const days = Math.floor( seconds / 86400 );
  const hours = Math.floor( ( seconds % 86400 ) / 3600 );
  const minutes = Math.floor( ( seconds % 3600 ) / 60 );
  const secs = Math.floor( seconds % 60 );

  if ( days > 0 ) {
    return `${ days }d ${ hours }h ${ minutes }m ${ secs }s`;
  } else if ( hours > 0 ) {
    return `${ hours }h ${ minutes }m ${ secs }s`;
  } else if ( minutes > 0 ) {
    return `${ minutes }m ${ secs }s`;
  } else {
    return `${ secs }s`;
  }
}

module.exports = processCommand;
