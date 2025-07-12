// tests/services/messageService.test.js
const axios = require('axios');
const { sendPrivateMessage, sendGroupMessage } = require('../../src/services/messageService.js');

jest.mock('axios');

describe('messageService', () => {
  let logSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('sendPrivateMessage sends a private message and logs output', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "Message sent successfully!"
      }
    });

    await sendPrivateMessage();

    expect(axios.post).toHaveBeenCalledTimes(1);

    // Check that the first argument logged contains the success message string
    expect(logSpy.mock.calls[0][0]).toEqual(expect.stringContaining('✅ Private message sent:'));
  });

  test('sendGroupMessage sends a group message and logs output', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "Message sent successfully!"
      }
    });

    await sendGroupMessage();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toEqual(expect.stringContaining('✅ Group message sent:'));
  });
});
