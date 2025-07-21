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
});
