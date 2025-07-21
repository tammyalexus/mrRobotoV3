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

  test('buildCustomData creates expected structure', async () => {
    const result = await messageService.buildCustomData('Hello test');

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
