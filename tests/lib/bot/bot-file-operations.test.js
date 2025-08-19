const { Bot } = require('../../../src/lib/bot.js');

describe('Bot - File Operations Integration', () => {
  let bot;
  let mockServices;
  
  // We'll use the real fs module but mock its behavior
  const originalFS = require('fs').promises;
  
  beforeEach(() => {
    mockServices = {
      config: {
        HANGOUT_ID: 'test-hangout-123',
        BOT_USER_TOKEN: 'test-bot-token-456',
        BOT_UID: 'test-bot-uid-789'
      },
      logger: {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn()
      },
      messageService: {
        joinChat: jest.fn(),
        fetchGroupMessages: jest.fn()
      },
      parseCommands: jest.fn(),
      commandService: jest.fn(),
      updateLastMessageId: jest.fn()
    };

    bot = new Bot('test-slug', mockServices);
  });

  describe('_writeSocketMessagesToLogFile with real fs module', () => {
    test('should handle file write errors', async () => {
      // Mock fs.appendFile to throw an error
      const fs = require('fs').promises;
      const originalAppendFile = fs.appendFile;
      
      const testError = new Error('Permission denied');
      fs.appendFile = jest.fn().mockRejectedValue(testError);
      
      await bot._writeSocketMessagesToLogFile('test.log', { test: 'data' });
      
      // Check that error was logged
      expect(mockServices.logger.error).toHaveBeenCalledWith(
        `Failed to write to log file test.log: ${testError.message}`
      );
      
      // Restore original method
      fs.appendFile = originalAppendFile;
    });

    test('should successfully write to file', async () => {
      // Mock fs.appendFile to succeed
      const fs = require('fs').promises;
      const originalAppendFile = fs.appendFile;
      
      fs.appendFile = jest.fn().mockResolvedValue();
      
      await bot._writeSocketMessagesToLogFile('success.log', { success: true });
      
      // Should not log any errors
      expect(mockServices.logger.error).not.toHaveBeenCalled();
      
      // Should have called appendFile
      expect(fs.appendFile).toHaveBeenCalled();
      
      // Restore original method
      fs.appendFile = originalAppendFile;
    });
  });
});
