const { fetchPrivateMessages } = require('../../../src/services/messageService');
const cometchatApi = require('../../../src/services/cometchatApi');

jest.mock('../../../src/services/cometchatApi');

describe('fetchPrivateMessages', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('logs the sender and message when lastMessage exists', async () => {
    const mockLastMessage = {
      id: '25812293',
      sender: 'abcdef-ccd3-4c1b-9846-5336fbd3b415',
      data: {
        text: 'Hello Mr. Roboto version 3!',
        metadata: {},
        entities: {}
      }
    };

    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({
        data: {
          data: {
            lastMessage: mockLastMessage
          }
        }
      })
    };

    await fetchPrivateMessages();

    expect(logSpy).toHaveBeenCalledWith(
      '📥 Private message from abcdef-ccd3-4c1b-9846-5336fbd3b415: Hello Mr. Roboto version 3!'
    );
  });

  test('logs a fallback message if text is missing', async () => {
    const mockLastMessage = {
      sender: 'user-123',
      data: {}
    };

    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({
        data: {
          data: {
            lastMessage: mockLastMessage
          }
        }
      })
    };

    await fetchPrivateMessages();

    expect(logSpy).toHaveBeenCalledWith(
      '📥 Private message from user-123: [No Text]'
    );
  });

  test('logs when no lastMessage exists', async () => {
    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({
        data: {
          data: {
            lastMessage: null
          }
        }
      })
    };

    await fetchPrivateMessages();

    expect(logSpy).toHaveBeenCalledWith('📥 No private messages found.');
  });

  test('logs an error when the API call fails', async () => {
    cometchatApi.apiClient = {
      get: jest.fn().mockRejectedValue(new Error('Request failed'))
    };

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await fetchPrivateMessages();

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Error fetching private messages:',
      'Request failed'
    );

    errorSpy.mockRestore();
  });
});
