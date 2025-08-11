const { messageService } = require('../services/messageService.js');
const { logger } = require('../utils/logging.js');

/**
 * Processes an array of command messages and sends responses
 * @param {Array<{data: {text: string}, id: string}>} messages - Array of message objects
 * @returns {Promise<void>}
 * @throws {Error} If messages parameter is invalid or processing fails
 */
async function parseCommands( messages ) {
  if ( !Array.isArray( messages ) ) {
    throw new Error( 'Invalid messages parameter: expected an array' );
  }

  for ( const message of messages ) {
    try {
      if ( !message?.data?.text ) {
        logger.warn( '⚠️ Skipping invalid message format:', message );
        continue;
      }

      const commandText = message.data.text;
      logger.debug( `⚙️ Processing command [${ message.id }]: ${ commandText }` );

      await messageService.sendGroupMessage( `I heard the command ${ commandText }` );

    } catch ( error ) {
      logger.error( `❌ Failed to process command [${ message?.id }]:`, error.message );
      // Continue processing other messages even if one fails
    }
  }
}

module.exports = parseCommands;
