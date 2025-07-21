const axios = require('axios');
const { messageService } = require('../../../src/services/messageService.js');

jest.mock('axios');

describe('messageService', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
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
  });

  test('sendPrivateMessage logs error on axios failure', async () => {
    // Spy on console.error to verify error logging
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock axios.post to reject with an error object
    const error = {
      response: {
        data: { message: 'Unauthorized' }
      }
    };
    axios.post.mockRejectedValue(error);

    await messageService.sendPrivateMessage('Hello Error');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Failed to send private message:',
      error.response.data
    );

    errorSpy.mockRestore();
  });

  test('sendGroupMessage logs error on axios failure', async () => {
    // Spy on console.error to verify error logging
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock axios.post to reject with an error object
    const error = {
      response: {
        data: { message: 'Group message failed' }
      }
    };
    axios.post.mockRejectedValue(error);

    await messageService.sendGroupMessage('Test group message');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Failed to send private message:',
      error.response.data
    );

    errorSpy.mockRestore();
  });
});
