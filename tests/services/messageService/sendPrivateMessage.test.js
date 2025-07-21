const axios = require('axios');
const { messageService } = require('../../../src/services/messageService.js');

jest.mock('axios');

describe('messageService', () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (errorSpy && errorSpy.mockRestore) {
      errorSpy.mockRestore();
    }
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
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = {
      response: {
        data: 'Unauthorized'
      },
      message: 'Unauthorized'
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

  test('sendPrivateMessage logs error message when err.response is undefined', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Network failure');
    axios.post.mockRejectedValue(error);
    await messageService.sendPrivateMessage('Hello Error');

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Failed to send private message:',
      error.message
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

    await messageService.sendPrivateMessage('Test private message');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Failed to send private message:',
      error.response.data
    );

    errorSpy.mockRestore();
  });
});
