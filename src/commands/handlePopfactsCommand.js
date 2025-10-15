// Set required role level for this command
const requiredRole = 'USER';
const description = 'Get interesting facts about the currently playing song';
const example = 'popfacts';
const hidden = false;

/**
 * Handle the !popfacts command
 * Gets interesting facts about the currently playing song using AI
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Command arguments (not used for this command)
 * @param {Object} commandParams.services - Service container
 * @param {Object} commandParams.context - Command context
 * @param {string} commandParams.responseChannel - Response channel ('public' or 'request')
 * @returns {Promise<Object>} Command result
 */
async function handlePopfactsCommand(commandParams) {
  const { services, context, responseChannel = 'request' } = commandParams;
  const { messageService, machineLearningService, hangoutState, logger, dataService } = services;

  try {
    // Get the currently playing song from hangout state
    const nowPlaying = hangoutState?.nowPlaying;
    
    if (!nowPlaying || !nowPlaying.song) {
      const response = '🎵 No song is currently playing. Start a song first and try again!';
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
        error: 'No song currently playing'
      };
    }

    const { trackName, artistName } = nowPlaying.song;
    
    if (!trackName || !artistName) {
      const response = '🎵 Unable to get song details. Please try again when a song is playing.';
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
        error: 'Missing song details'
      };
    }

    // Prepare the question for the AI
    const questionTemplate = dataService.getValue('editableMessages.popfactsMessage') || 
      `The song I'm currently listening to is \${trackName} by \${artistName}. Tell me three short interesting facts about the song and/or the artist. When searching note that it may or may not be a cover version. Do not tell me that you're giving me three facts as part of the reply`;
    
    const theQuestion = questionTemplate
      .replace(/\${trackName}/g, trackName)
      .replace(/\${artistName}/g, artistName);

    logger.debug(`[popfacts] Asking AI about: ${trackName} by ${artistName}`);

    // Get facts from the machine learning service
    const aiResponse = await machineLearningService.askGoogleAI(theQuestion);

    // Format the response
    let response;
    if (aiResponse && aiResponse !== "No response" && !aiResponse.includes("error occurred")) {
      response = `🎵 **${trackName}** by **${artistName}**\n\n${aiResponse}`;
    } else {
      response = `🎵 Sorry, I couldn't get facts about "${trackName}" by ${artistName} right now. Please try again later.`;
    }

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
    logger.error(`[popfacts] Error getting song facts: ${error.message}`);
    
    const response = '🎵 Sorry, there was an error getting song facts. Please try again later.';
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

// Attach metadata to the function
handlePopfactsCommand.requiredRole = requiredRole;
handlePopfactsCommand.description = description;
handlePopfactsCommand.example = example;
handlePopfactsCommand.hidden = hidden;

module.exports = handlePopfactsCommand;