// Mock the modules before importing messageService
jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('axios');

// Now import the modules that use the mocked dependencies
const axios = require('axios');
const { messageService } = require('../../../src/services/messageService.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sendPrivateMessage sends correct payload with resolved customData', async () => {
    axios.post.mockResolvedValue({
      data: { success: true, message: 'Message sent successfully!' }
    });

    await messageService.sendPrivateMessage('Hello Test');

    expect(axios.post).toHaveBeenCalledTimes(1);
    const calledPayload = axios.post.mock.calls[0][1]; // second argument of axios.post

    // Assert that customData was resolved properly (not a Promise)
    expect(calledPayload).toHaveProperty('data.metadata.chatMessage.message', 'Hello Test');
    expect(typeof calledPayload.data.metadata.chatMessage).toBe('object');
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('✅ Private message sent:'));
  });

  test('sendPrivateMessage logs error on axios failure', async () => {
    const error = {
      response: {
        data: 'Unauthorized'
      },
      message: 'Unauthorized'
    };

    axios.post.mockRejectedValue(error);

    await messageService.sendPrivateMessage('Hello Error');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to send private message: Unauthorized')
    );
  });

  test('sendPrivateMessage logs error message when err.response is undefined', async () => {
    const error = new Error('Network failure');
    axios.post.mockRejectedValue(error);

    await messageService.sendPrivateMessage('Hello Error');

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to send private message: Network failure')
    );
  });

  test('sendPrivateMessage logs error on axios failure with response data', async () => {
    // Mock axios.post to reject with an error object
    const error = {
      response: {
        data: { message: 'Private message failed' }
      }
    };
    axios.post.mockRejectedValue(error);

    await messageService.sendPrivateMessage('Test private message');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to send private message:')
    );
  });
});
