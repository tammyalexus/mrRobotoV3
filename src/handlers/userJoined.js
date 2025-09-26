/**
 * Handler for when a user joins the hangout
 * @param {Object} message - The stateful message containing user data
 * @param {Object} state - The current hangout state
 * @param {Object} services - Services container
 */
async function userJoined ( message, state, services ) {
  services.logger.debug( 'userJoined.js handler called' );

  try {
    // Check if state is available - during initial connection, state might not be set yet
    if ( !state || !services.stateService ) {
      services.logger.debug( 'State not available yet, skipping userJoined processing during initial connection' );
      return;
    }

    // Look for the patch operation that adds user data
    const userDataPatch = message.statePatch.find( patch =>
      patch.op === 'add' &&
      patch.path.startsWith( '/allUserData/' )
    );

    if ( userDataPatch ) {
      const nickname = userDataPatch.value?.userProfile?.nickname;
      if ( !nickname ) {
        services.logger.warn( 'No nickname found in user data' );
        return;
      }

      // Safely get hangout name with fallback
      let hangoutName = 'our Hangout';
      try {
        hangoutName = services.stateService.getHangoutName();
      } catch ( error ) {
        services.logger.debug( 'Could not get hangout name from state service, using fallback' );
      }

      // Get welcome message template from data service, fallback to default if not found
      services.logger.debug( 'Getting welcome message from dataService...' );
      const messageTemplate = services.dataService.getValue( 'welcomeMessage' ) || "👋 Welcome to {hangoutName}, {username}!";
      services.logger.debug( `Retrieved welcome message template: ${ messageTemplate }` );

      // Replace placeholders with actual values
      const personalizedMessage = messageTemplate
        .replace( '{username}', nickname )
        .replace( '{hangoutName}', hangoutName );

      services.logger.debug( `Sending personalized welcome message: ${ personalizedMessage }` );

      // Send the personalized welcome message
      await services.messageService.sendGroupMessage( personalizedMessage, { services } );

      services.logger.debug( `✅ Welcome message sent for user: ${ nickname }` );
    } else {
      services.logger.debug( 'No user data patch found in userJoined message' );
    }
  } catch ( error ) {
    services.logger.error( `Error processing userJoined message: ${ error.message }` );
  }
}

module.exports = userJoined;
