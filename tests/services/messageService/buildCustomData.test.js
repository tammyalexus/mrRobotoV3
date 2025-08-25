const { messageService } = require('../../../src/services/messageService.js');
const { logger } = require('../../../src/lib/logging.js');

jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('axios');

describe('messageService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('buildCustomData creates expected structure', async () => {
    const mockServices = {
      dataService: {
        getValue: jest.fn()
          .mockReturnValueOnce('avatar123')  // for CHAT_AVATAR_ID
          .mockReturnValueOnce('TestBot')    // for CHAT_NAME
          .mockReturnValueOnce('ff0000'),    // for CHAT_COLOUR
        getAllData: jest.fn().mockReturnValue({
          botData: {
            CHAT_AVATAR_ID: 'avatar123',
            CHAT_NAME: 'TestBot',
            CHAT_COLOUR: 'ff0000'
          }
        })
      }
    };

    const result = await messageService.buildCustomData('Hello test', mockServices);

    expect(result).toMatchObject({
      message: 'Hello test',
      avatarId: expect.any(String),
      userName: expect.any(String),
      color: expect.stringMatching(/^#[A-Fa-f0-9]{6}$/),
      mentions: [],
      userUuid: expect.any(String),
      badges: ['VERIFIED', 'STAFF'],
      id: expect.any(String)
    });
  });
});
