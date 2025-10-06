const config = require('../config.js');
const fs = require('fs').promises;
const path = require('path');

// Set required role level for this command - requires moderator or higher
const requiredRole = 'MODERATOR';

/**
 * Updates the welcome message used when new users join
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments (new welcome message)
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @param {string} commandParams.responseChannel - Response channel ('public' or 'request')
 * @returns {Promise<Object>} Command result
 */
async function handleWelcomeCommand(commandParams) {
    const { args, services, context, responseChannel = 'request' } = commandParams;
    const { messageService, dataService } = services;

    if (!args || args.trim().length === 0) {
        const response = `❌ Please provide a new welcome message. Usage: ${config.COMMAND_SWITCH}welcome Hi {username}, welcome to {hangoutName}`;
        await messageService.sendResponse(response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        });
        return {
            success: false,
            shouldRespond: true,
            response
        };
    }

    const { logger } = services;
    logger.info('Starting welcome message update process');
    try {
        // Load current data
        logger.debug('Loading current data...');
        await dataService.loadData();
        const currentData = dataService.getAllData();
        logger.debug(`Current data before update: ${JSON.stringify(currentData)}`);

        const newData = {
            ...currentData,
            welcomeMessage: args
        };
        logger.debug(`New data to write: ${JSON.stringify(newData)}`);

        // Write to file (catch errors here)
        const dataFilePath = path.join(process.cwd(), 'data.json');
        logger.debug(`Writing to file: ${dataFilePath}`);
        try {
            await fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), 'utf8');
        } catch (error) {
            const response = `❌ Failed to update welcome message: ${error.message}`;
            await messageService.sendResponse(response, {
                responseChannel,
                isPrivateMessage: context?.fullMessage?.isPrivateMessage,
                sender: context?.sender,
                services
            });
            return {
                success: false,
                shouldRespond: true,
                response,
                error: error.message
            };
        }

        // Verify file was written correctly
        const fileContent = await fs.readFile(dataFilePath, 'utf8');
        logger.debug(`File content after write: ${fileContent}`);

        // Reload the data in the service to ensure it's up to date
        logger.debug('Reloading data into service...');
        await dataService.loadData();

        // Verify the update in memory
        const reloadedData = dataService.getAllData();
        logger.debug(`Data in memory after reload: ${JSON.stringify(reloadedData)}`);

        // Verify the specific welcome message was updated
        const updatedMessage = dataService.getValue('welcomeMessage');
        logger.debug(`Updated welcome message in service: ${updatedMessage}`);

        if (updatedMessage !== args) {
            const response = `❌ Failed to update welcome message: Welcome message in memory does not match new message after reload`;
            await messageService.sendResponse(response, {
                responseChannel,
                isPrivateMessage: context?.fullMessage?.isPrivateMessage,
                sender: context?.sender,
                services
            });
            return {
                success: false,
                shouldRespond: true,
                response,
                error: 'Welcome message in memory does not match new message after reload'
            };
        }

        const response = `✅ Welcome message updated to: "${args}"`;
        await messageService.sendResponse(response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        });
        return {
            success: true,
            shouldRespond: true,
            response
        };
    } catch (error) {
        const response = `❌ Failed to update welcome message: ${error.message}`;
        await messageService.sendResponse(response, {
            responseChannel,
            isPrivateMessage: context?.fullMessage?.isPrivateMessage,
            sender: context?.sender,
            services
        });
        return {
            success: false,
            shouldRespond: true,
            response,
            error: error.message
        };
    }
}

// Attach role level to the function
handleWelcomeCommand.requiredRole = requiredRole;

module.exports = handleWelcomeCommand;
