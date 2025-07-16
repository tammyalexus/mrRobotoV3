const { fetchGroupMessages } = require('../../../src/services/messageService');
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

  test('logs formatted group messages from API response', async () => {
    const mockMessages = [
      {
        id: '25324828',
        sender: 'sdfsdf-28c4-4ec6-a9eb-2cdfacbcafbc',
        data: {
          text: '/escortme'
        }
      },
      {
        id: '25324829',
        sender: 'a1sdfsd-ccd3-4c1b-9846-5336fbd3b415',
        data: {
          text: '@wibble you will be escorted after you play your song'
        }
      }
    ];

    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({
        data: { data: mockMessages }
      })
    };

    await fetchGroupMessages();

    expect(cometchatApi.apiClient.get).toHaveBeenCalledTimes(1);

    expect(logSpy).toHaveBeenCalledWith(
      '📥 Group messages:',
      [
        'sdfsdf-28c4-4ec6-a9eb-2cdfacbcafbc: /escortme',
        'a1sdfsd-ccd3-4c1b-9846-5336fbd3b415: @wibble you will be escorted after you play your song'
      ]
    );
  });

  test('logs an error when the API call fails', async () => {
    const error = new Error('Network failure');
    cometchatApi.apiClient = {
      get: jest.fn().mockRejectedValue(error)
    };

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await fetchGroupMessages();

    expect(console.error).toHaveBeenCalledWith(
      '❌ Error fetching group messages:',
      'Network failure'
    );

    errorSpy.mockRestore();
  });

  test('logs empty group messages if none are returned', async () => {
    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({ data: { data: [] } })
    };

    await fetchGroupMessages();

    expect(console.log).toHaveBeenCalledWith('📥 Group messages:', []);
  });

  test('logs [No Text] if a message is missing text', async () => {
    const mockMessages = [
      {
        id: '1',
        sender: 'user-1',
        data: {}
      }
    ];

    cometchatApi.apiClient = {
      get: jest.fn().mockResolvedValue({ data: { data: mockMessages } })
    };

    await fetchGroupMessages();

    expect(console.log).toHaveBeenCalledWith('📥 Group messages:', ['user-1: [No Text]']);
  });
});