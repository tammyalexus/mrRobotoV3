// Mock modules before importing messageService
jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const { messageService } = require('../../../src/services/messageService.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService.markAllPrivateUserMessagesAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the methods that markAllPrivateUserMessagesAsRead depends on
    messageService.returnLastUserMessage = jest.fn();
    messageService.markMessageAsInterracted = jest.fn();
  });

  test('should mark message as read when user has unread messages', async () => {
    const lastMessageId = 'message-123';
    messageService.returnLastUserMessage.mockResolvedValue(lastMessageId);
    messageService.markMessageAsInterracted.mockResolvedValue();

    await messageService.markAllPrivateUserMessagesAsRead('test-user');

    expect(messageService.returnLastUserMessage).toHaveBeenCalledWith('test-user');
    expect(messageService.markMessageAsInterracted).toHaveBeenCalledWith(lastMessageId);
  });

  test('should handle when user has no unread messages', async () => {
    messageService.returnLastUserMessage.mockResolvedValue(null);

    await messageService.markAllPrivateUserMessagesAsRead('test-user');

    expect(messageService.returnLastUserMessage).toHaveBeenCalledWith('test-user');
    expect(messageService.markMessageAsInterracted).not.toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    const error = new Error('Database error');
    messageService.returnLastUserMessage.mockRejectedValue(error);

    await messageService.markAllPrivateUserMessagesAsRead('test-user');

    expect(logger.error).toHaveBeenCalledWith('❌ Error marking all private user messages as read for user test-user: Database error');
  });

  test('should handle errors from markMessageAsInterracted', async () => {
    const lastMessageId = 'message-123';
    const error = new Error('Mark error');
    messageService.returnLastUserMessage.mockResolvedValue(lastMessageId);
    messageService.markMessageAsInterracted.mockRejectedValue(error);

    await messageService.markAllPrivateUserMessagesAsRead('test-user');

    expect(logger.error).toHaveBeenCalledWith('❌ Error marking all private user messages as read for user test-user: Mark error');
  });
});
