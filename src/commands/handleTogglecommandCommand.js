const config = require( '../config.js' );
const fs = require( 'fs' );
const path = require( 'path' );

// Set required role level for this command
const requiredRole = 'OWNER';
const description = 'Toggle a command enabled/disabled state';
const example = 'togglecommand enable/disable/status ping';
const hidden = false;

/**
 * Get the current disabled commands from data.json
 * @returns {Array} Array of disabled command names
 */
function getDisabledCommands() {
    try {
        const dataPath = path.join( __dirname, '../../data.json' );
        const data = JSON.parse( fs.readFileSync( dataPath, 'utf8' ) );
        return Array.isArray( data.disabledCommands ) ? data.disabledCommands : [];
    } catch ( error ) {
        return [];
    }
}

/**
 * Update the disabled commands list in data.json
 * @param {Array} disabledCommands - Array of disabled command names
 */
function updateDisabledCommands( disabledCommands ) {
    const dataPath = path.join( __dirname, '../../data.json' );
    const data = JSON.parse( fs.readFileSync( dataPath, 'utf8' ) );
    data.disabledCommands = disabledCommands;
    fs.writeFileSync( dataPath, JSON.stringify( data, null, 2 ), 'utf8' );
}

/**
 * Check if a command exists by looking for its file
 * @param {string} commandName - The command name to check
 * @returns {boolean} True if command exists
 */
function commandExists( commandName ) {
    const commandsDir = path.join( __dirname, '../commands' );
    const commandFileName = `handle${ commandName.charAt( 0 ).toUpperCase() + commandName.slice( 1 ) }Command.js`;
    return fs.existsSync( path.join( commandsDir, commandFileName ) );
}

/**
 * Toggles the enabled state of a command via data.json
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Action and command name (enable/disable/status commandname)
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @param {string} commandParams.responseChannel - Response channel ('public' or 'request')
 * @returns {Promise<Object>} Command result
 */
async function handleTogglecommandCommand ( commandParams ) {
    const { args, services, context, responseChannel = 'request' } = commandParams;
    const { messageService } = services;

    if ( !args || args.trim().length === 0 ) {
        const response = `❌ Please provide an action and command name. Usage: ${ config.COMMAND_SWITCH }togglecommand <enable/disable/status> <command>`;
        await messageService.sendResponse( response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        } );
        return {
            success: false,
            shouldRespond: true,
            response
        };
    }

    const parts = args.trim().toLowerCase().split( /\s+/ );
    if ( parts.length !== 2 ) {
        const response = `❌ Invalid syntax. Usage: ${ config.COMMAND_SWITCH }togglecommand <enable/disable/status> <command>`;
        await messageService.sendResponse( response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        } );
        return {
            success: false,
            shouldRespond: true,
            response
        };
    }

    const [ action, commandName ] = parts;

    // Validate action
    if ( ![ 'enable', 'disable', 'status' ].includes( action ) ) {
        const response = `❌ Invalid action '${ action }'. Use: enable, disable, or status`;
        await messageService.sendResponse( response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        } );
        return {
            success: false,
            shouldRespond: true,
            response
        };
    }

    // Check if the command exists
    if ( !commandExists( commandName ) ) {
        const response = `❌ Command '${ commandName }' does not exist.`;
        await messageService.sendResponse( response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        } );
        return {
            success: false,
            shouldRespond: true,
            response
        };
    }

    // Special case: cannot disable unknown command
    if ( commandName === 'unknown' && action === 'disable' ) {
        const response = `❌ Cannot disable the 'unknown' command as it handles unrecognized commands.`;
        await messageService.sendResponse( response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        } );
        return {
            success: false,
            shouldRespond: true,
            response
        };
    }

    try {
        const disabledCommands = getDisabledCommands();
        const isCurrentlyDisabled = disabledCommands.includes( commandName );

        let response;

        if ( action === 'status' ) {
            const status = isCurrentlyDisabled ? 'disabled' : 'enabled';
            response = `ℹ️ Command '${ commandName }' is currently ${ status }.`;
        } else if ( action === 'enable' ) {
            if ( !isCurrentlyDisabled ) {
                response = `ℹ️ Command '${ commandName }' is already enabled.`;
            } else {
                // Remove from disabled list
                const newDisabledCommands = disabledCommands.filter( cmd => cmd !== commandName );
                updateDisabledCommands( newDisabledCommands );
                response = `✅ Command '${ commandName }' has been enabled.`;
            }
        } else if ( action === 'disable' ) {
            if ( isCurrentlyDisabled ) {
                response = `ℹ️ Command '${ commandName }' is already disabled.`;
            } else {
                // Add to disabled list
                const newDisabledCommands = [ ...disabledCommands, commandName ];
                updateDisabledCommands( newDisabledCommands );
                response = `✅ Command '${ commandName }' has been disabled.`;
            }
        }

        await messageService.sendResponse( response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        } );

        return {
            success: true,
            shouldRespond: true,
            response
        };

    } catch ( error ) {
        const response = `❌ Failed to ${ action } command '${ commandName }': ${ error.message }`;
        await messageService.sendResponse( response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        } );
        return {
            success: false,
            shouldRespond: true,
            response,
            error: error.message
        };
    }
}

// Attach metadata to the function
handleTogglecommandCommand.requiredRole = requiredRole;
handleTogglecommandCommand.description = description;
handleTogglecommandCommand.example = example;
handleTogglecommandCommand.hidden = hidden;

module.exports = handleTogglecommandCommand;