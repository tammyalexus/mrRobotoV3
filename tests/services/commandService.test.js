// Mock the entire messageService module to prevent real API calls
jest.mock('../../src/services/messageService.js', () => ({
  messageService: {
    sendGroupMessage: jest.fn().mockResolvedValue({ success: true })
  }
}));

// Mock logging module
jest.mock('../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));

// Mock config module
jest.mock('../../src/config.js', () => ({
  COMMAND_SWITCH: '!'
}));

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

// Mock context
const mockContext = {
  sender: 'testUser',
  fullMessage: {},
  chatMessage: '!help'
};

describe('commandService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processCommand', () => {
    test('should handle help command', async () => {
      const result = await commandService('help', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('Available Commands');
      expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
        expect.stringContaining('Available Commands')
      );
    });

    test('should handle ping command', async () => {
      const result = await commandService('ping', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('Pong');
      expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
        expect.stringContaining('Pong')
      );
    });

    test('should handle status command', async () => {
      const result = await commandService('status', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('Bot Status');
      expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
        expect.stringContaining('Bot Status')
      );
    });

    test('should handle echo command with message', async () => {
      const testMessage = 'Hello World';
      const result = await commandService('echo', testMessage, mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain(testMessage);
      expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
    });

    test('should handle echo command without message', async () => {
      const result = await commandService('echo', '', mockServices, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('Echo what?');
    });

    test('should handle unknown command', async () => {
      const result = await commandService('unknown', '', mockServices, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Unknown command');
      expect(result.response).toContain('Unknown command');
    });

    test('should handle errors gracefully', async () => {
      // Mock messageService to throw an error
      mockMessageService.sendGroupMessage.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await commandService('ping', '', mockServices, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should work without services parameter (fallback)', async () => {
      // This test ensures backward compatibility with mocked messageService
      const result = await commandService('help', '');
      
      // Should not throw an error and should use the mocked messageService
      expect(typeof result).toBe('object');
      expect(result.success).toBe(true);
      expect(result.response).toContain('Available Commands');
    });

    test('should handle command with extra whitespace', async () => {
      const result = await commandService('  ping  ', '  ', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.response).toContain('Pong');
    });

    test('should handle command with mixed case', async () => {
      const result = await commandService('HELP', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.response).toContain('Available Commands');
    });

    test('should handle different error types', async () => {
      // Test with string error
      mockMessageService.sendGroupMessage.mockRejectedValueOnce('String error');
      
      const result1 = await commandService('ping', '', mockServices, mockContext);
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('String error');
      
      // Test with null error
      mockMessageService.sendGroupMessage.mockRejectedValueOnce(null);
      
      const result2 = await commandService('ping', '', mockServices, mockContext);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Unknown error');
      
      // Test with object error (no message property)
      mockMessageService.sendGroupMessage.mockRejectedValueOnce({});
      
      const result3 = await commandService('ping', '', mockServices, mockContext);
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('[object Object]');
    });
  });

  describe('formatUptime utility (via status command)', () => {
    let originalUptime;

    beforeEach(() => {
      // Save original process.uptime
      originalUptime = process.uptime;
    });

    afterEach(() => {
      // Restore original process.uptime
      process.uptime = originalUptime;
    });

    test('should format uptime with days', async () => {
      // Mock uptime to be more than a day (90061 seconds = 1 day, 1 hour, 1 minute, 1 second)
      process.uptime = jest.fn(() => 90061);
      
      const result = await commandService('status', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.response).toContain('1d 1h 1m 1s');
    });

    test('should format uptime with hours only', async () => {
      // Mock uptime to be 3661 seconds (1 hour, 1 minute, 1 second)
      process.uptime = jest.fn(() => 3661);
      
      const result = await commandService('status', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.response).toContain('1h 1m 1s');
    });

    test('should format uptime with minutes only', async () => {
      // Mock uptime to be 61 seconds (1 minute, 1 second)
      process.uptime = jest.fn(() => 61);
      
      const result = await commandService('status', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.response).toContain('1m 1s');
    });

    test('should format uptime with seconds only', async () => {
      // Mock uptime to be 30 seconds
      process.uptime = jest.fn(() => 30);
      
      const result = await commandService('status', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.response).toContain('30s');
    });
  });
});
