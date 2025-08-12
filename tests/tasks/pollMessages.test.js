// Mock dependencies before requiring the module under test
jest.mock('../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../src/services/messageService.js', () => ({
  messageService: {
    fetchGroupMessages: jest.fn(),
    fetchPrivateMessages: jest.fn()
  }
}));

jest.mock('../../src/services/parseCommands.js', () => jest.fn());

// Mock setInterval
jest.useFakeTimers();

// Now import the modules
const { startGroupMessagePolling, startPrivateMessagePolling } = require('../../src/tasks/pollMessages.js');
const { messageService } = require('../../src/services/messageService.js');
const parseCommands = require('../../src/services/parseCommands.js');
const { logger } = require('../../src/lib/logging.js');

describe('pollMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startGroupMessagePolling', () => {
    test('fetches group messages and processes commands when messages exist', async () => {
      const mockMessages = [
        { id: '2', data: { text: '!command2' } },
        { id: '1', data: { text: '!command1' } }
      ];

      messageService.fetchGroupMessages.mockResolvedValue(mockMessages);

      // Start polling
      startGroupMessagePolling(1000);

      // Fast-forward until the first interval
      jest.advanceTimersByTime(1000);

      // Wait for async operations to complete
      await Promise.resolve();

      // Verify calls
      expect(messageService.fetchGroupMessages).toHaveBeenCalled();
      expect(parseCommands).toHaveBeenCalledWith([
        { id: '1', data: { text: '!command1' } },
        { id: '2', data: { text: '!command2' } }
      ]);
    });

    test('does not process commands when no messages exist', async () => {
      messageService.fetchGroupMessages.mockResolvedValue([]);

      // Start polling
      startGroupMessagePolling(1000);

      // Fast-forward until the first interval
      jest.advanceTimersByTime(1000);

      // Wait for async operations to complete
      await Promise.resolve();

      // Verify calls
      expect(messageService.fetchGroupMessages).toHaveBeenCalled();
      expect(parseCommands).not.toHaveBeenCalled();
    });

    test('logs error when fetching messages fails', async () => {
      const error = new Error('API error');
      messageService.fetchGroupMessages.mockRejectedValue(error);

      // Start polling
      startGroupMessagePolling(1000);

      // Fast-forward until the first interval
      jest.advanceTimersByTime(1000);

      // Wait for async operations to complete
      await Promise.resolve();

      // Verify error logging
      expect(messageService.fetchGroupMessages).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('❌ Group polling error:', 'API error');
    });
  });

  describe('startPrivateMessagePolling', () => {
    test('logs private messages when they exist', async () => {
      const mockMessages = [
        { id: '2', data: { text: '!private2' } },
        { id: '1', data: { text: '!private1' } }
      ];

      messageService.fetchPrivateMessages.mockResolvedValue(mockMessages);

      // Start polling
      startPrivateMessagePolling(1000);

      // Fast-forward until the first interval
      jest.advanceTimersByTime(1000);

      // Wait for async operations to complete
      await Promise.resolve();

      // Verify calls
      expect(messageService.fetchPrivateMessages).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Private messages received:', [
        { id: '1', data: { text: '!private1' } },
        { id: '2', data: { text: '!private2' } }
      ]);
    });

    test('does not log when no private messages exist', async () => {
      messageService.fetchPrivateMessages.mockResolvedValue([]);

      // Start polling
      startPrivateMessagePolling(1000);

      // Fast-forward until the first interval
      jest.advanceTimersByTime(1000);

      // Wait for async operations to complete
      await Promise.resolve();

      // Verify calls
      expect(messageService.fetchPrivateMessages).toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    });

    test('logs error when fetching private messages fails', async () => {
      const error = new Error('API error');
      messageService.fetchPrivateMessages.mockRejectedValue(error);

      // Start polling
      startPrivateMessagePolling(1000);

      // Fast-forward until the first interval
      jest.advanceTimersByTime(1000);

      // Wait for async operations to complete
      await Promise.resolve();

      // Verify error logging
      expect(messageService.fetchPrivateMessages).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('❌ Private polling error:', 'API error');
    });
  });
});
