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
      
      // Get welcome message template from data service, fallback to default if not found
      services.logger.debug('Getting welcome message from dataService...');
      const messageTemplate = services.dataService.getValue('welcomeMessage') || "👋 Welcome to {hangoutName}, {username}!";
      services.logger.debug(`Retrieved welcome message template: ${messageTemplate}`);
      
      // Replace placeholders in the template
      const welcomeMessage = messageTemplate
        .replace('{hangoutName}', hangoutName)
        .replace('{username}', nickname);
      
      services.logger.debug(`Sending welcome message: ${welcomeMessage}`);
      await services.messageService.sendGroupMessage(welcomeMessage, { services });
    }
  } catch (error) {
    services.logger.error('Error processing userJoined message:', error);
  }
}

module.exports = userJoined;
