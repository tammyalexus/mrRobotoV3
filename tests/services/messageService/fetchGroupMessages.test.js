const { messageService } = require('../../../src/services/messageService.js');
const cometchatApi = require('../../../src/services/cometchatApi');

jest.mock('../../../src/services/cometchatApi');

describe('fetchGroupMessages', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns formatted group messages from API response', async () => {
    const { COMMAND_SWITCH } = process.env;
    const mockMessages = [
      {
        id: '25324828',
        sentAt: undefined,
        sender: 'user-123',
        data: { text: `${COMMAND_SWITCH}escortme` }
      },
      {
        id: '25324848',
        sentAt: undefined,
        sender: 'user-789',
        data: { text: `wibble` }
      },
      {
        id: '25324829',
        sentAt: undefined,
        sender: 'user-456',
        data: { text: `${COMMAND_SWITCH}hello` }
      }
    ];

    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({ data: { data: mockMessages } })
    };

    const result = await messageService.fetchGroupMessages();

    expect(result).toEqual([
      {
        id: '25324828',
        sentAt: undefined,
        sender: 'user-123',
        data: {
          text: `${ COMMAND_SWITCH }escortme`
        }
      },
      {
        id: '25324829',
        sentAt: undefined,
        sender: 'user-456',
        data: {
          text: `${ COMMAND_SWITCH }hello`
        }
      }
    ]);
  });

  test('logs an error when the API call fails', async () => {
    const error = new Error('Network failure');
    cometchatApi.apiClient = {
      get: jest.fn().mockRejectedValue(error)
    };

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await messageService.fetchGroupMessages();

    expect(console.error).toHaveBeenCalledWith(
      '❌ Error fetching group messages:',
      'Network failure'
    );

    errorSpy.mockRestore();
  });

  test('returns empty array if no group messages are found', async () => {
    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({ data: { data: [] } })
    };

    const result = await messageService.fetchGroupMessages();
    expect(result).toEqual([]);
  });

  test('returns parsed message with [No Text] if message is missing text', async () => {
    const mockMessages = [
      {
        id: '1',
        sender: 'user-1',
        sentAt: 1234567890,
        data: {}
      }
    ];

    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({ data: { data: mockMessages } })
    };

    const result = await messageService.fetchGroupMessages();

    expect(result).toEqual([]);
  });;
});