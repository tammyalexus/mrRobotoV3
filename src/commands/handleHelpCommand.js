const config = require( '../config.js' );
const fs = require( 'fs' );
const path = require( 'path' );

// Set required role level for this command
const requiredRole = 'USER';
const description = 'Show this help message';
const example = 'help [command]';
const hidden = false;

/**
 * Dynamically loads all available commands and their metadata
 * @returns {Object} Commands organized by role
 */
function loadAvailableCommands () {
  const commands = {};
  const commandsDir = path.join( __dirname, '../commands' );

  fs.readdirSync( commandsDir ).forEach( file => {
    if ( file.endsWith( '.js' ) ) {
      // Extract command name from filename: handleStateCommand.js -> state
      const match = file.match( /^handle(.*)Command\.js$/ );
      if ( match && match[ 1 ] ) {
        const commandName = match[ 1 ].toLowerCase();
        const commandModule = require( path.join( commandsDir, file ) );

        // Skip commands that are hidden or don't have required metadata
        if ( !commandModule.hidden && commandModule.requiredRole && commandModule.description ) {
          commands[ commandName ] = {
            name: commandName,
            role: commandModule.requiredRole,
            description: commandModule.description,
            example: commandModule.example || commandName, // Use the example or fallback to command name
            hidden: commandModule.hidden || false
          };
        }
      }
    }
  } );

  return commands;
}

/**
 * Groups commands by role and sorts them alphabetically
 * @param {Object} commands - All available commands
 * @returns {Object} Commands organized by role
 */
function organizeCommandsByRole ( commands ) {
  const organized = {
    USER: [],
    MODERATOR: [],
    OWNER: []
  };

  Object.values( commands ).forEach( command => {
    if ( organized[ command.role ] ) {
      organized[ command.role ].push( command );
    }
  } );

  // Sort each role's commands alphabetically
  Object.keys( organized ).forEach( role => {
    organized[ role ].sort( ( a, b ) => a.name.localeCompare( b.name ) );
  } );

  return organized;
}

/**
 * Shows available commands and their usage
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @param {string} commandParams.responseChannel - Response channel ('public' or 'request')
 * @returns {Promise<Object>} Command result
 */
async function handleHelpCommand ( commandParams ) {
  const { args, services, context, responseChannel = 'request' } = commandParams;
  const { messageService } = services;

  try {
    const availableCommands = loadAvailableCommands();

    // If a specific command is requested
    if ( args && args.trim() ) {
      const requestedCommand = args.trim().toLowerCase();
      const command = availableCommands[ requestedCommand ];

      if ( command ) {
        // Show specific command help
        const helpText = `🤖 Help for command: ${ config.COMMAND_SWITCH }${ command.name }\n\n` +
                        `📝 Description: ${ command.description }\n` +
                        `🎯 Example: ${ config.COMMAND_SWITCH }${ command.example }\n` +
                        `👤 Required Role: ${ command.role }`;

        await messageService.sendResponse( helpText, {
          responseChannel,
          isPrivateMessage: context?.fullMessage?.isPrivateMessage,
          sender: context?.sender,
          services
        } );

        return {
          success: true,
          response: helpText,
          shouldRespond: true
        };
      } else {
        // Command doesn't exist
        const errorText = `❌ Command "${ requestedCommand }" does not exist.\n` +
                         `Type ${ config.COMMAND_SWITCH }help to see all available commands.`;

        await messageService.sendResponse( errorText, {
          responseChannel,
          isPrivateMessage: context?.fullMessage?.isPrivateMessage,
          sender: context?.sender,
          services
        } );

        return {
          success: false,
          response: errorText,
          shouldRespond: true,
          error: `Command "${requestedCommand}" not found`
        };
      }
    }

    // Show general help (all commands)
    const organizedCommands = organizeCommandsByRole( availableCommands );

    let helpText = '🤖 Available Commands:\n\n';

    // Add User commands
    if ( organizedCommands.USER.length > 0 ) {
      helpText += '👤 User Commands:\n';
      organizedCommands.USER.forEach( command => {
        helpText += `${ config.COMMAND_SWITCH }${ command.name } - ${ command.description }\n`;
      } );
      helpText += '\n';
    }

    // Add Moderator commands
    if ( organizedCommands.MODERATOR.length > 0 ) {
      helpText += '🛡️ Moderator Commands:\n';
      organizedCommands.MODERATOR.forEach( command => {
        helpText += `${ config.COMMAND_SWITCH }${ command.name } - ${ command.description }\n`;
      } );
      helpText += '\n';
    }

    // Add Owner commands
    if ( organizedCommands.OWNER.length > 0 ) {
      helpText += '👑 Owner Commands:\n';
      organizedCommands.OWNER.forEach( command => {
        helpText += `${ config.COMMAND_SWITCH }${ command.name } - ${ command.description }\n`;
      } );
      helpText += '\n';
    }

    // Add footer with specific help instructions
    helpText += `💡 Tip: Type ${ config.COMMAND_SWITCH }help [command] to see specific examples and usage.`;

    // Remove extra trailing newlines
    helpText = helpText.replace(/\n+$/, '');

    await messageService.sendResponse( helpText, {
      responseChannel,
      isPrivateMessage: context?.fullMessage?.isPrivateMessage,
      sender: context?.sender,
      services
    } );

    return {
      success: true,
      response: helpText,
      shouldRespond: true
    };
  } catch ( error ) {
    const errorResponse = '❌ Error loading help information. Please try again.';
    await messageService.sendResponse( errorResponse, {
      responseChannel,
      isPrivateMessage: context?.fullMessage?.isPrivateMessage,
      sender: context?.sender,
      services
    } );

    return {
      success: false,
      response: errorResponse,
      shouldRespond: true,
      error: error.message
    };
  }
}

// Attach metadata to the function
handleHelpCommand.requiredRole = requiredRole;
handleHelpCommand.description = description;
handleHelpCommand.example = example;
handleHelpCommand.hidden = hidden;

module.exports = handleHelpCommand;
