/**
 * Handle the !feature command for managing bot features
 * @param {Object} message - The message object
 * @param {string} subCommand - The subcommand (list, enable, disable, status)
 * @param {Array} args - Additional arguments
 * @param {Object} services - Service container
 */
async function handleFeatureCommand( message, subCommand, args, services ) {
  const { featuresService, messageService, stateService } = services;

  // Check if user has required permissions (owner only)
  const senderRole = stateService.getUserRole( message.userId );
  
  if ( senderRole !== 'owner' ) {
    await messageService.groupMessage( 'Only the room owner can manage features.' );
    return;
  }

  switch ( subCommand ) {
    case 'list':
      await handleListFeatures( featuresService, messageService );
      break;
    
    case 'enable':
      await handleEnableFeature( args[0], featuresService, messageService );
      break;
    
    case 'disable':
      await handleDisableFeature( args[0], featuresService, messageService );
      break;
    
    case 'status':
      await handleFeatureStatus( args[0], featuresService, messageService );
      break;
    
    default:
      await messageService.groupMessage( 
        'Usage: !feature <list|enable|disable|status> [featureName]\n\n' +
        'Examples:\n' +
        '!feature list\n' +
        '!feature enable welcomeMessage\n' +
        '!feature disable nowPlayingMessage\n' +
        '!feature status welcomeMessage'
      );
  }
}

/**
 * Handle the list subcommand
 */
async function handleListFeatures( featuresService, messageService ) {
  const features = featuresService.getAllFeatures();
  
  let response = 'Available Features:\n\n';
  
  if ( features.enabled.length > 0 ) {
    response += '✅ Enabled:\n';
    features.enabled.forEach( feature => {
      response += `- ${feature}\n`;
    });
    response += '\n';
  } else {
    response += '✅ Enabled:\n(none)\n\n';
  }
  
  if ( features.disabled.length > 0 ) {
    response += '❌ Disabled:\n';
    features.disabled.forEach( feature => {
      response += `- ${feature}\n`;
    });
  } else {
    response += '❌ Disabled:\n(none)';
  }
  
  await messageService.groupMessage( response );
}

/**
 * Handle the enable subcommand
 */
async function handleEnableFeature( featureName, featuresService, messageService ) {
  if ( !featureName ) {
    await messageService.groupMessage( 'Usage: !feature enable <featureName>' );
    return;
  }
  
  const wasEnabled = featuresService.enableFeature( featureName );
  
  if ( wasEnabled ) {
    await messageService.groupMessage( `Feature "${featureName}" has been enabled.` );
  } else {
    await messageService.groupMessage( `Feature "${featureName}" is already enabled.` );
  }
}

/**
 * Handle the disable subcommand
 */
async function handleDisableFeature( featureName, featuresService, messageService ) {
  if ( !featureName ) {
    await messageService.groupMessage( 'Usage: !feature disable <featureName>' );
    return;
  }
  
  const wasDisabled = featuresService.disableFeature( featureName );
  
  if ( wasDisabled ) {
    await messageService.groupMessage( `Feature "${featureName}" has been disabled.` );
  } else {
    await messageService.groupMessage( `Feature "${featureName}" is already disabled.` );
  }
}

/**
 * Handle the status subcommand
 */
async function handleFeatureStatus( featureName, featuresService, messageService ) {
  if ( !featureName ) {
    await messageService.groupMessage( 'Usage: !feature status <featureName>' );
    return;
  }
  
  const isEnabled = featuresService.isFeatureEnabled( featureName );
  const status = isEnabled ? 'enabled ✅' : 'disabled ❌';
  
  await messageService.groupMessage( `Feature "${featureName}" is currently ${status}.` );
}

module.exports = handleFeatureCommand;

// Command metadata for help system
module.exports.requiredRole = 'OWNER';
module.exports.description = 'Manage optional bot features';
module.exports.example = 'feature list';
module.exports.hidden = false;