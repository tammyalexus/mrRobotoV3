// Integration test for command flow: parseCommands -> commandService
const parseCommands = require('../../src/services/parseCommands.js');
const commandService = require('../../src/services/commandService.js');

// Mock messageService
const mockMessageService = {
  sendGroupMessage: jest.fn().mockResolvedValue({ success: true })
};

// Mock services
const mockServices = {
  messageService: mockMessageService,
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  },
  config: {
    COMMAND_SWITCH: '!'
  }
};

describe('Command Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should parse command and process it through commandService', async () => {
    // Step 1: Parse the command
    const parseResult = await parseCommands('!help', mockServices);
    
    expect(parseResult).toEqual({
      isCommand: true,
      command: 'help',
      remainder: '',
      originalText: '!help'
    });

    // Step 2: Process the command through commandService
    const context = {
      sender: 'testUser',
      fullMessage: {},
      chatMessage: '!help'
    };

    const commandResult = await commandService(
      parseResult.command,
      parseResult.remainder,
      mockServices,
      context
    );

    expect(commandResult.success).toBe(true);
    expect(commandResult.shouldRespond).toBe(true);
    expect(commandResult.response).toContain('Available Commands');
    expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
      expect.stringContaining('Available Commands')
    );
  });

  test('should parse command with arguments and process through commandService', async () => {
    // Step 1: Parse the command with arguments
    const parseResult = await parseCommands('!echo Hello World', mockServices);
    
    expect(parseResult).toEqual({
      isCommand: true,
      command: 'echo',
      remainder: 'Hello World',
      originalText: '!echo Hello World'
    });

    // Step 2: Process the command through commandService
    const context = {
      sender: 'testUser',
      fullMessage: {},
      chatMessage: '!echo Hello World'
    };

    const commandResult = await commandService(
      parseResult.command,
      parseResult.remainder,
      mockServices,
      context
    );

    expect(commandResult.success).toBe(true);
    expect(commandResult.shouldRespond).toBe(true);
    expect(commandResult.response).toContain('Hello World');
    expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
      expect.stringContaining('Hello World')
    );
  });

  test('should return false for non-commands and not call commandService', async () => {
    // Step 1: Parse non-command message
    const parseResult = await parseCommands('Hello everyone', mockServices);
    
    expect(parseResult).toBe(false);

    // commandService should not be called for non-commands
    // This simulates what _handleMessage does
    if (parseResult && parseResult.isCommand) {
      // This should not execute
      expect(true).toBe(false);
    }
    
    expect(mockMessageService.sendGroupMessage).not.toHaveBeenCalled();
  });

  test('should handle unknown commands gracefully', async () => {
    // Step 1: Parse unknown command
    const parseResult = await parseCommands('!unknown', mockServices);
    
    expect(parseResult).toEqual({
      isCommand: true,
      command: 'unknown',
      remainder: '',
      originalText: '!unknown'
    });

    // Step 2: Process unknown command through commandService
    const context = {
      sender: 'testUser',
      fullMessage: {},
      chatMessage: '!unknown'
    };

    const commandResult = await commandService(
      parseResult.command,
      parseResult.remainder,
      mockServices,
      context
    );

    expect(commandResult.success).toBe(false);
    expect(commandResult.shouldRespond).toBe(true);
    expect(commandResult.error).toBe('Unknown command');
    expect(commandResult.response).toContain('Unknown command');
    expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
      expect.stringContaining('Unknown command')
    );
  });
});
