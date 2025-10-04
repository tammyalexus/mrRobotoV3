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
 * @param {string} commandParams.responseChannel - Response channel ('public' or 'request')
 * @returns {Promise<Object>} - Command result
 */
async function handleXXXCommand(commandParams) {
    const { args, services, context, responseChannel = 'request' } = commandParams;
    const { messageService } = services;  // Extract any services you need

    // Your command logic here
    const response = `Command XXX executed with args: ${args}`;
    
    // Use messageService.sendResponse for automatic channel routing
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
| responseChannel | string | Where to send the response ('public' or 'request') |

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

## Response Channels

The `responseChannel` parameter controls where the bot sends its response:

### Channel Options

- **`'request'` (default)**: Responds in the same channel as the original message
  - If the command was sent in public chat → responds in public chat
  - If the command was sent as a private message → responds as a private message
- **`'public'`**: Always responds in the public group chat, regardless of where the command originated

### Using Response Channels

Always use `messageService.sendResponse()` instead of `sendGroupMessage()` or `sendPrivateMessage()` directly:

```javascript
// ✅ Correct: Respects responseChannel setting
await messageService.sendResponse(response, {
    responseChannel,
    isPrivateMessage: context?.fullMessage?.isPrivateMessage,
    sender: context?.sender,
    services
});

// ❌ Incorrect: Always sends to group chat
await messageService.sendGroupMessage(response);

// ❌ Incorrect: Always sends private message
await messageService.sendPrivateMessage(response, sender, services);
```

### Example Response Scenarios

```javascript
// User sends "!help" in public chat with responseChannel='request'
// → Bot responds in public chat

// User sends "!help" via private message with responseChannel='request'  
// → Bot responds via private message

// User sends "!help" via private message with responseChannel='public'
// → Bot responds in public chat (announces the help publicly)
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

### Handling Errors with Response Channels

When handling errors, make sure to send error messages using the same response channel pattern:

```javascript
if (!args.trim()) {
    const errorResponse = '❓ Please provide the required arguments.';
    await messageService.sendResponse(errorResponse, {
        responseChannel,
        isPrivateMessage: context?.fullMessage?.isPrivateMessage,
        sender: context?.sender,
        services
    });
    return {
        success: false,
        shouldRespond: true,
        response: errorResponse
    };
}
```

## Example Command

Here's a complete example of a simple greeting command:

```javascript
const requiredRole = 'USER';

async function handleGreetCommand(commandParams) {
    const { args, services, context, responseChannel = 'request' } = commandParams;
    const { messageService } = services;

    const name = args || context.sender;
    const response = `👋 Hello, ${name}!`;
    
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
