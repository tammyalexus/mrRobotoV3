const { logger } = require( '../lib/logging.js' );
const config = require( '../config.js' );
const fs = require( 'fs' );
const path = require( 'path' );

// Dynamically load all command handlers from src/commands
const commands = {};
const commandsDir = path.join( __dirname, '../commands' );
fs.readdirSync( commandsDir ).forEach( file => {
  if ( file.endsWith( '.js' ) ) {
    // Extract command name from filename: handleStateCommand.js -> state
    const match = file.match( /^handle(.*)Command\.js$/ );
    if ( match && match[ 1 ] ) {
      const commandName = match[ 1 ].toLowerCase();
      commands[ commandName ] = require( path.join( commandsDir, file ) );
    }
    // Also support handleUnknownCommand.js as 'unknown'
    if ( file === 'handleUnknownCommand.js' ) {
      commands[ 'unknown' ] = require( path.join( commandsDir, file ) );
    }
  }
} );

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

    let result;
    // Always treat 'unknown' command as an unknown command
    if ( trimmedCommand === 'unknown' || !commands[ trimmedCommand ] ) {
      result = await commands.unknown( trimmedCommand, args, messageService, context );
      return result;  // The unknown command handler already sets the correct properties
    }

    // Handle known commands
    if ( trimmedCommand === 'echo' ) {
      result = await commands.echo( args, messageService, hangUserService, context );
    } else if ( trimmedCommand === 'state' ) {
      result = await commands.state( services, context );
    } else {
      result = await commands[ trimmedCommand ]( args, messageService, context );
    }

    return result;
  } catch ( error ) {
    const errorMessage = error && typeof error === 'object'
      ? ( error.message || error.toString() || 'Unknown error object' )
      : ( error || 'Unknown error' );
    logger.error( `Failed to process command "${ command }": ${ errorMessage }` );

    // If error is specifically about unknown command, respond to user
    const isUnknownCommand = ( errorMessage === 'Unknown command' ) || ( error && error.error === 'Unknown command' );
    if ( isUnknownCommand ) {
      const response = `❓ Unknown command: "${ command }". Type ${ config.COMMAND_SWITCH }help for available commands.`;
      await messageService.sendGroupMessage( response );
      return {
        success: false,
        error: 'Unknown command',
        response,
        shouldRespond: true
      };
    } else {
      // For other errors (network, string, etc.), do not respond to user
      return {
        success: false,
        error: errorMessage,
        shouldRespond: false
      };
    }
  }
}

module.exports = processCommand;
