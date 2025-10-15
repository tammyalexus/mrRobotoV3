const config = require( '../config.js' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );

// Set required role level for this command - requires moderator or higher
const requiredRole = 'MODERATOR';
const description = 'Edit editable message templates (welcomeMessage, nowPlayingMessage, justPlayedMessage, popfactsMessage)';
const example = 'edit nowPlayingMessage {username} is now playing {trackName} by {artistName}';
const hidden = false;

// Define which messages are editable
const EDITABLE_MESSAGES = {
  'welcomeMessage': {
    name: 'Welcome Message',
    availableTokens: ['{username}', '{hangoutName}'],
    example: 'Hi {username}, welcome to {hangoutName}!'
  },
  'nowPlayingMessage': {
    name: 'Now Playing Message',
    availableTokens: ['{username}', '{trackName}', '{artistName}'],
    example: '{username} is now playing {trackName} by {artistName}'
  },
  'justPlayedMessage': {
    name: 'Just Played Message',
    availableTokens: ['{username}', '{trackName}', '{artistName}', '{likes}', '{dislikes}', '{stars}'],
    example: '{username} played...\n{trackName} by {artistName}\nStats: 👍 {likes} 👎 {dislikes} ❤️ {stars}'
  },
  'popfactsMessage': {
    name: 'Popfacts AI Question Template',
    availableTokens: ['${trackName}', '${artistName}'],
    example: 'Tell me about the song ${trackName} by ${artistName}. Please provide interesting facts.'
  }
};

/**
 * Updates an editable message template
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments (messageType and new message)
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @param {string} commandParams.responseChannel - Response channel ('public' or 'request')
 * @returns {Promise<Object>} Command result
 */
async function handleEditCommand ( commandParams ) {
    const { args, services, context, responseChannel = 'request' } = commandParams;
    const { messageService, dataService, logger } = services;

    // Parse arguments
    if ( !args || args.trim().length === 0 ) {
        const availableMessages = Object.keys( EDITABLE_MESSAGES ).join( ', ' );
        const response = `❌ Please specify a message type and new content.\n\n**Usage:** \`${ config.COMMAND_SWITCH }edit <messageType> <newMessage>\`\n\n**Available message types:** ${ availableMessages }\n\n**Example:** \`${ config.COMMAND_SWITCH }edit nowPlayingMessage {username} is now playing {trackName} by {artistName}\``;
        
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

    // Split args into messageType and newMessage
    const argParts = args.split( ' ' );
    const messageType = argParts[0];
    const newMessage = argParts.slice( 1 ).join( ' ' );

    // Validate message type
    if ( !EDITABLE_MESSAGES[messageType] ) {
        const availableMessages = Object.keys( EDITABLE_MESSAGES ).join( ', ' );
        const response = `❌ Invalid message type: "${messageType}"\n\n**Available message types:** ${ availableMessages }`;
        
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
            error: `Invalid message type: ${messageType}`
        };
    }

    // Validate new message content
    if ( !newMessage || newMessage.trim().length === 0 ) {
        const messageInfo = EDITABLE_MESSAGES[messageType];
        const response = `❌ Please provide a new ${messageInfo.name.toLowerCase()}.\n\n**Available tokens:** ${ messageInfo.availableTokens.join( ', ' ) }\n\n**Example:** \`${ config.COMMAND_SWITCH }edit ${ messageType } ${ messageInfo.example }\``;
        
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
            error: 'Missing message content'
        };
    }

    const messageInfo = EDITABLE_MESSAGES[messageType];
    logger.info( `Starting ${ messageInfo.name.toLowerCase() } update process` );

    try {
        // Load current data
        logger.debug( 'Loading current data...' );
        await dataService.loadData();
        const currentData = dataService.getAllData();
        logger.debug( `Current data before update: ${ JSON.stringify( currentData ) }` );

        // Update the data structure
        let newData;
        if ( currentData.editableMessages ) {
            // New structure: update within editableMessages
            newData = {
                ...currentData,
                editableMessages: {
                    ...currentData.editableMessages,
                    [messageType]: newMessage
                }
            };
        } else {
            // Legacy structure: update at root level and create new structure
            newData = {
                ...currentData,
                editableMessages: {
                    welcomeMessage: currentData.welcomeMessage || 'Hi {username}, welcome to {hangoutName}!',
                    nowPlayingMessage: currentData.nowPlayingMessage || '{username} is now playing {trackName} by {artistName}',
                    justPlayedMessage: currentData.justPlayedMessage || '{username} played...\n{trackName} by {artistName}\nStats: 👍 {likes} 👎 {dislikes} ❤️ {stars}',
                    [messageType]: newMessage
                }
            };
            // Remove old root-level properties
            delete newData.welcomeMessage;
            delete newData.nowPlayingMessage;
            delete newData.justPlayedMessage;
        }

        logger.debug( `New data to write: ${ JSON.stringify( newData ) }` );

        // Write to file
        const dataFilePath = path.join( process.cwd(), 'data.json' );
        logger.debug( `Writing to file: ${ dataFilePath }` );
        
        try {
            await fs.writeFile( dataFilePath, JSON.stringify( newData, null, 2 ), 'utf8' );
        } catch ( error ) {
            const response = `❌ Failed to update ${ messageInfo.name.toLowerCase() }: ${ error.message }`;
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

        // Verify file was written correctly
        const fileContent = await fs.readFile( dataFilePath, 'utf8' );
        logger.debug( `File content after write: ${ fileContent }` );

        // Reload the data in the service to ensure it's up to date
        logger.debug( 'Reloading data into service...' );
        await dataService.loadData();

        // Verify the update in memory
        const reloadedData = dataService.getAllData();
        logger.debug( `Data in memory after reload: ${ JSON.stringify( reloadedData ) }` );

        // Verify the specific message was updated (check both old and new locations)
        let updatedMessage = dataService.getValue( `editableMessages.${messageType}` );
        if ( !updatedMessage ) {
            // Fallback to old location for backward compatibility
            updatedMessage = dataService.getValue( messageType );
        }
        
        logger.debug( `Updated ${ messageType } in service: ${ updatedMessage }` );

        if ( updatedMessage !== newMessage ) {
            const response = `❌ Failed to update ${ messageInfo.name.toLowerCase() }: Message in memory does not match new message after reload`;
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
                error: 'Message in memory does not match new message after reload'
            };
        }

        const response = `✅ ${ messageInfo.name } updated to: "${ newMessage }"`;
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
        const response = `❌ Failed to update ${ messageInfo.name.toLowerCase() }: ${ error.message }`;
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
handleEditCommand.requiredRole = requiredRole;
handleEditCommand.description = description;
handleEditCommand.example = example;
handleEditCommand.hidden = hidden;

module.exports = handleEditCommand;