const axios = require('axios');
const { sendGroupMessage } = require('../../../src/services/messageService.js');

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
