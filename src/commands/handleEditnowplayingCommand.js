const config = require( '../config.js' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );

// Set required role level for this command - requires moderator or higher
const requiredRole = 'MODERATOR';
const description = 'Update the now playing message template';
const example = 'editnowplaying {username} is now playing {trackName} by {artistName}';
const hidden = false;

/**
 * Updates the now playing message template used when songs change
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments (new now playing message template)
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @param {string} commandParams.responseChannel - Response channel ('public' or 'request')
 * @returns {Promise<Object>} Command result
 */
async function handleEditnowplayingCommand ( commandParams ) {
    const { args, services, context, responseChannel = 'request' } = commandParams;
    const { messageService, dataService } = services;

    if ( !args || args.trim().length === 0 ) {
        const response = `❌ Please provide a new now playing message template. Usage: ${ config.COMMAND_SWITCH }editnowplaying {username} is now playing {trackName} by {artistName}`;
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

    const { logger } = services;
    logger.info( 'Starting now playing message template update process' );
    try {
        // Load current data
        logger.debug( 'Loading current data...' );
        await dataService.loadData();
        const currentData = dataService.getAllData();
        logger.debug( `Current data before update: ${ JSON.stringify( currentData ) }` );

        const newData = {
            ...currentData,
            nowPlayingMessage: args
        };
        logger.debug( `New data to write: ${ JSON.stringify( newData ) }` );

        // Write to file (catch errors here)
        const dataFilePath = path.join( process.cwd(), 'data.json' );
        logger.debug( `Writing to file: ${ dataFilePath }` );
        try {
            await fs.writeFile( dataFilePath, JSON.stringify( newData, null, 2 ), 'utf8' );
        } catch ( error ) {
            const response = `❌ Failed to update now playing message template: ${ error.message }`;
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

        // Verify the specific now playing message was updated
        const updatedMessage = dataService.getValue( 'nowPlayingMessage' );
        logger.debug( `Updated now playing message template in service: ${ updatedMessage }` );

        if ( updatedMessage !== args ) {
            const response = `❌ Failed to update now playing message template: Now playing message template in memory does not match new template after reload`;
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
                error: 'Now playing message template in memory does not match new template after reload'
            };
        }

        const response = `✅ Now playing message template updated to: "${ args }"`;
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
        const response = `❌ Failed to update now playing message template: ${ error.message }`;
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
handleEditnowplayingCommand.requiredRole = requiredRole;
handleEditnowplayingCommand.description = description;
handleEditnowplayingCommand.example = example;
handleEditnowplayingCommand.hidden = hidden;

module.exports = handleEditnowplayingCommand;