const services = require('../services/serviceContainer.js');

/**
 * Handler for when a user joins the hangout
 * @param {Object} message - The stateful message containing user data
 */
async function userJoined(message) {
  services.logger.debug('userJoined.js handler called');

  try {
    // Look for the patch operation that adds user data
    const userDataPatch = message.statePatch.find(patch => 
      patch.op === 'add' && 
      patch.path.startsWith('/allUserData/')
    );

    if (userDataPatch) {
      const nickname = userDataPatch.value?.userProfile?.nickname;
      if (!nickname) {
        services.logger.warn('No nickname found in user data');
        return;
      }

      const hangoutName = services.stateService.getHangoutName();
      const welcomeMessage = `👋 Welcome to ${hangoutName}, ${nickname}!`;
      
      services.logger.debug(`Sending welcome message: ${welcomeMessage}`);
      await services.messageService.sendGroupMessage(welcomeMessage);
    }
  } catch (error) {
    services.logger.error('Error processing userJoined message:', error);
  }
}

module.exports = userJoined;
