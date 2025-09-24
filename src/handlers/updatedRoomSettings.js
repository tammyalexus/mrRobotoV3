const services = require('../services/serviceContainer.js');

/**
 * Handler for when room settings are updated (including room name changes)
 * @param {Object} message - The stateful message containing room settings updates
 */
async function updatedRoomSettings(message) {
  services.logger.debug('updatedRoomSettings.js handler called');

  try {
    // Look for patch operations that update room settings
    if (message.statePatch && Array.isArray(message.statePatch)) {
      
      // Check for room name updates
      const nameUpdatePatch = message.statePatch.find(patch => 
        patch.op === 'replace' && 
        patch.path === '/settings/name'
      );

      if (nameUpdatePatch && nameUpdatePatch.value) {
        const newRoomName = nameUpdatePatch.value;
        services.logger.info(`🏠 Room name updated to: "${newRoomName}"`);
        
        // Verify the StateService can read the new name
        const stateServiceName = services.stateService.getHangoutName();
        services.logger.info(`✅ StateService now reads room name as: "${stateServiceName}"`);
        
        // Welcome messages will automatically use the new name for future users
      }

      // Log other settings changes for debugging
      const otherPatches = message.statePatch.filter(patch => 
        patch.path.startsWith('/settings/') && patch.path !== '/settings/name'
      );
      
      if (otherPatches.length > 0) {
        services.logger.debug(`Other room settings updated: ${otherPatches.map(p => p.path).join(', ')}`);
      }
    }
  } catch (error) {
    services.logger.error('Error processing updatedRoomSettings message:', error);
  }
}

module.exports = updatedRoomSettings;