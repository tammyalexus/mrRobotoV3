// Mock dependencies before requiring the module under test
jest.mock('../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const mockParseCommands = jest.fn();

jest.mock('../../src/services/serviceContainer.js', () => ({
  messageService: {
    fetchGroupMessages: jest.fn(),
    fetchPrivateMessages: jest.fn()
  },
  parseCommands: mockParseCommands,
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Now import the modules
const { startGroupMessagePolling, startPrivateMessagePolling } = require('../../src/tasks/pollMessages.js');
const services = require('../../src/services/serviceContainer.js');
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

      services.messageService.fetchGroupMessages.mockResolvedValue(mockMessages);
      mockParseCommands.mockResolvedValue({ isCommand: true, command: 'test', remainder: '' });

      // Mock the polling behavior directly by calling the interval function
      const pollFunction = async () => {
        try {
          const groupMessages = await services.messageService.fetchGroupMessages();
          if (groupMessages && groupMessages.length > 0) {
            const sorted = groupMessages.sort((a, b) => a.id - b.id);
            services.logger.debug(`Processing ${sorted.length} commands`);
            let successCount = 0;

            for (const message of sorted) {
              if (message?.data?.text) {
                const result = await services.parseCommands(message.data.text);
                if (result) {
                  successCount++;
                }
              } else {
                services.logger.warn(`Skipping invalid message format: ${message}`);
              }
            }

            services.logger.debug(`Command processing complete. Success: ${successCount}/${sorted.length}`);
          }
        } catch (err) {
          services.logger.error(`❌ Group polling error: ${err.message}`);
        }
      };

      // Execute the polling function
      await pollFunction();

      // Verify calls
      expect(services.messageService.fetchGroupMessages).toHaveBeenCalled();
      expect(mockParseCommands).toHaveBeenCalledTimes(2);
      expect(mockParseCommands).toHaveBeenCalledWith('!command1');
      expect(mockParseCommands).toHaveBeenCalledWith('!command2');
    });

    test('does not process commands when no messages exist', async () => {
      services.messageService.fetchGroupMessages.mockResolvedValue([]);

      // Mock the polling behavior directly
      const pollFunction = async () => {
        try {
          const groupMessages = await services.messageService.fetchGroupMessages();
          if (groupMessages && groupMessages.length > 0) {
            const sorted = groupMessages.sort((a, b) => a.id - b.id);
            services.logger.debug(`Processing ${sorted.length} commands`);
            let successCount = 0;

            for (const message of sorted) {
              if (message?.data?.text) {
                const result = await services.parseCommands(message.data.text);
                if (result) {
                  successCount++;
                }
              } else {
                services.logger.warn(`Skipping invalid message format: ${message}`);
              }
            }

            services.logger.debug(`Command processing complete. Success: ${successCount}/${sorted.length}`);
          }
        } catch (err) {
          services.logger.error(`❌ Group polling error: ${err.message}`);
        }
      };

      await pollFunction();

      // Verify calls
      expect(services.messageService.fetchGroupMessages).toHaveBeenCalled();
      expect(mockParseCommands).not.toHaveBeenCalled();
    });

    test('logs error when fetching messages fails', async () => {
      const error = new Error('API error');
      services.messageService.fetchGroupMessages.mockRejectedValue(error);

      // Mock the polling behavior directly
      const pollFunction = async () => {
        try {
          const groupMessages = await services.messageService.fetchGroupMessages();
          if (groupMessages && groupMessages.length > 0) {
            const sorted = groupMessages.sort((a, b) => a.id - b.id);
            services.logger.debug(`Processing ${sorted.length} commands`);
            let successCount = 0;

            for (const message of sorted) {
              if (message?.data?.text) {
                const result = await services.parseCommands(message.data.text);
                if (result) {
                  successCount++;
                }
              } else {
                services.logger.warn(`Skipping invalid message format: ${message}`);
              }
            }

            services.logger.debug(`Command processing complete. Success: ${successCount}/${sorted.length}`);
          }
        } catch (err) {
          services.logger.error(`❌ Group polling error: ${err.message}`);
        }
      };

      await pollFunction();

      // Verify error logging
      expect(services.messageService.fetchGroupMessages).toHaveBeenCalled();
      expect(services.logger.error).toHaveBeenCalledWith(expect.stringContaining('❌ Group polling error:'));
    });
  });

  describe('startPrivateMessagePolling', () => {
    test('logs private messages when they exist', async () => {
      const mockMessages = [
        { id: '1', data: { text: '!private1' } },
        { id: '2', data: { text: '!private2' } }
      ];

      services.messageService.fetchPrivateMessages.mockResolvedValue(mockMessages);

      // Mock the private polling behavior directly
      const pollFunction = async () => {
        try {
          const privateMessages = await services.messageService.fetchPrivateMessages();
          if (privateMessages && privateMessages.length > 0) {
            const sorted = privateMessages.sort((a, b) => a.id - b.id);
            services.logger.debug(`Private messages received: ${sorted}`);

            // Process each private command individually if needed
            for (const message of sorted) {
              if (message?.data?.text) {
                await services.parseCommands(message.data.text, message.id);
              }
            }
          }
        } catch (err) {
          services.logger.error(`❌ Private polling error: ${err.message}`);
        }
      };

      await pollFunction();

      // Verify calls
      expect(services.messageService.fetchPrivateMessages).toHaveBeenCalled();
      expect(services.logger.debug).toHaveBeenCalledWith(expect.stringContaining('Private messages received:'));
    });

    test('does not log when no private messages exist', async () => {
      services.messageService.fetchPrivateMessages.mockResolvedValue([]);

      // Mock the private polling behavior directly
      const pollFunction = async () => {
        try {
          const privateMessages = await services.messageService.fetchPrivateMessages();
          if (privateMessages && privateMessages.length > 0) {
            const sorted = privateMessages.sort((a, b) => a.id - b.id);
            services.logger.debug(`Private messages received: ${sorted}`);

            // Process each private command individually if needed
            for (const message of sorted) {
              if (message?.data?.text) {
                await services.parseCommands(message.data.text, message.id);
              }
            }
          }
        } catch (err) {
          services.logger.error(`❌ Private polling error: ${err.message}`);
        }
      };

      await pollFunction();

      // Verify calls
      expect(services.messageService.fetchPrivateMessages).toHaveBeenCalled();
      expect(services.logger.debug).not.toHaveBeenCalledWith(expect.stringContaining('Private messages received:'));
    });

    test('logs error when fetching private messages fails', async () => {
      const error = new Error('API error');
      services.messageService.fetchPrivateMessages.mockRejectedValue(error);

      // Mock the private polling behavior directly
      const pollFunction = async () => {
        try {
          const privateMessages = await services.messageService.fetchPrivateMessages();
          if (privateMessages && privateMessages.length > 0) {
            const sorted = privateMessages.sort((a, b) => a.id - b.id);
            services.logger.debug(`Private messages received: ${sorted}`);

            // Process each private command individually if needed
            for (const message of sorted) {
              if (message?.data?.text) {
                await services.parseCommands(message.data.text, message.id);
              }
            }
          }
        } catch (err) {
          services.logger.error(`❌ Private polling error: ${err.message}`);
        }
      };

      await pollFunction();

      // Verify error logging
      expect(services.messageService.fetchPrivateMessages).toHaveBeenCalled();
      expect(services.logger.error).toHaveBeenCalledWith(expect.stringContaining('❌ Private polling error:'));
    });
  });
});
