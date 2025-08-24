# Writing New Commands

This guide explains how to create new bot commands for mrRobotoV3.

## File Structure

1. Create a new file in the `src/commands` directory
2. Name the file following the pattern: `handleXXXCommand.js` (where XXX is your command name)
3. The command name in the bot will be extracted from this filename

Example:
```javascript
// For a command !ping
// Create: src/commands/handlePingCommand.js
// Users will type: !ping
```

## Basic Command Structure

Every command file should follow this template:

```javascript
// Set the required permission level
const requiredRole = 'USER';  // Can be: 'OWNER', 'coOwner', 'MODERATOR', or 'USER'

/**
 * Handle the XXX command
 * @param {Object} commandParams - Standard command parameters
 * @param {string} commandParams.command - The command name
 * @param {string} commandParams.args - Everything after the command
 * @param {Object} commandParams.services - All available services
 * @param {Object} commandParams.context - Additional context (sender info etc.)
 * @returns {Promise<Object>} - Command result
 */
async function handleXXXCommand(commandParams) {
    const { args, services, context } = commandParams;
    const { messageService } = services;  // Extract any services you need

    // Your command logic here
    const response = `Command XXX executed with args: ${args}`;
    await messageService.sendGroupMessage(response);

    return {
        success: true,
        shouldRespond: true,
        response
    };
}

// Attach role level to the function
handleXXXCommand.requiredRole = requiredRole;

module.exports = handleXXXCommand;
```

## Command Parameters

The `commandParams` object contains:

| Parameter | Type | Description |
|-----------|------|-------------|
| command | string | The command name (lowercase) |
| args | string | Everything after the command |
| services | Object | All available services |
| context | Object | Sender info and message context |

### Available Services

Access services through `commandParams.services`:

```javascript
const { 
    messageService,    // Send messages to the room
    hangUserService,   // Interact with users
    stateService,     // Access room state
    hangoutState      // Direct access to state
} = services;
```

## Permission Levels

Set the required permission level at the top of your file:

```javascript
const requiredRole = 'USER';  // Most permissive
const requiredRole = 'MODERATOR';  // Requires moderator or higher
const requiredRole = 'coOwner';  // Requires co-owner or owner
const requiredRole = 'OWNER';  // Most restrictive
```

Permission hierarchy (highest to lowest):
1. OWNER
2. coOwner
3. MODERATOR
4. USER

## Command Response Format

Your command must return an object with:

```javascript
return {
    success: true,          // Was the command successful?
    shouldRespond: true,    // Should the bot send a response?
    response: "message"     // The response message (if shouldRespond is true)
};
```

## Example Command

Here's a complete example of a simple greeting command:

```javascript
const requiredRole = 'USER';

async function handleGreetCommand(commandParams) {
    const { args, services, context } = commandParams;
    const { messageService } = services;

    const name = args || context.sender;
    const response = `👋 Hello, ${name}!`;
    
    await messageService.sendGroupMessage(response);
    
    return {
        success: true,
        shouldRespond: true,
        response
    };
}

handleGreetCommand.requiredRole = requiredRole;

module.exports = handleGreetCommand;
```

## Testing Your Command

1. Create a test file in `tests/commands/handleXXXCommand.test.js`
2. Test different permission levels
3. Test with various arguments
4. Test error conditions

The command will be automatically loaded by the bot when you add it to the `src/commands` directory.
