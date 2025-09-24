const { logger } = require( '../lib/logging.js' );
const config = require( '../config.js' );
const fs = require( 'fs' );
const path = require( 'path' );
const { hasPermission } = require( '../lib/roleUtils' );

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
 * @param {Object} services - Required services container with messageService, etc.
 * @param {Object} context - Additional context (sender, fullMessage, etc.)
 * @returns {Promise<Object>} Result object with success status and response
 */
async function processCommand ( command, messageRemainder, services, context = {} ) {
  // Use the provided services directly - they should be complete
  const serviceContainer = services;

  try {
    const trimmedCommand = command.trim().toLowerCase();
    const args = messageRemainder.trim();

    logger.debug( `Processing command: "${ trimmedCommand }" with args: "${ args }"` );

    // Create standardized commandParams object that all commands will receive
    const commandParams = {
      command: trimmedCommand,      // The command name
      args: args,                   // Command arguments (everything after the command)
      services: serviceContainer,   // Pass the complete services container
      context                      // Context object with sender info etc.
    };

    // Always treat 'unknown' command as an unknown command
    if ( trimmedCommand === 'unknown' || !commands[ trimmedCommand ] ) {
      return await commands.unknown( commandParams );
    }

    // Check user's role and command permissions
    const userRole = await serviceContainer.stateService.getUserRole( context.sender );
    const commandLevel = commands[ trimmedCommand ].requiredRole || 'USER';

    if ( !hasPermission( userRole, commandLevel ) ) {
      const response = `❌ You don't have permission to use the "${ trimmedCommand }" command. Required role: ${ commandLevel }`;
      await serviceContainer.messageService.sendGroupMessage( response, { services: serviceContainer } );
      return {
        success: false,
        error: 'Insufficient permissions',
        response,
        shouldRespond: true
      };
    }

    // All commands now receive the same standardized parameters
    return await commands[ trimmedCommand ]( commandParams );
  } catch ( error ) {
    const errorMessage = error && typeof error === 'object'
      ? ( error.message || error.toString() || 'Unknown error object' )
      : ( error || 'Unknown error' );
    logger.error( `Failed to process command "${ command }": ${ errorMessage }` );

    // If error is specifically about unknown command, respond to user
    const isUnknownCommand = ( errorMessage === 'Unknown command' ) || ( error && error.error === 'Unknown command' );
    if ( isUnknownCommand ) {
      const response = `❓ Unknown command: "${ command }". Type ${ config.COMMAND_SWITCH }help for available commands.`;
      await serviceContainer.messageService.sendGroupMessage( response, { services: serviceContainer } );
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
