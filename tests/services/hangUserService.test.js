// Mock logger to keep test output clean
jest.mock('../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock config to provide gateway base URL and token
jest.mock('../../src/config.js', () => ({
  BOT_USER_TOKEN: 'TEST_BOT_TOKEN',
  TTFM_GATEWAY_BASE_URL: 'https://gateway.prod.tt.fm'
}));

// Mock makeRequest used by hangUserService
jest.mock('../../src/lib/buildUrl.js', () => ({
  makeRequest: jest.fn()
}));

const { makeRequest } = require('../../src/lib/buildUrl.js');
const { getUserNicknameByUuid } = require('../../src/services/hangUserService.js');

describe('hangUserService.getUserNicknameByUuid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns nickname when response contains top-level nickname', async () => {
    makeRequest.mockResolvedValueOnce({ nickname: 'Alice' });

    const uuid = 'f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc';
    const nickname = await getUserNicknameByUuid(uuid);

    expect(nickname).toBe('Alice');
    expect(makeRequest).toHaveBeenCalledWith(
      `https://gateway.prod.tt.fm/api/user-service/profile/${encodeURIComponent(uuid)}`,
      { method: 'GET' },
      { Authorization: 'Bearer TEST_BOT_TOKEN' }
    );
  });

  test('returns nickname when response contains nested data.nickname', async () => {
    makeRequest.mockResolvedValueOnce({ data: { nickname: 'Bob' } });

    const nickname = await getUserNicknameByUuid('abc');
    expect(nickname).toBe('Bob');
  });

  test('encodes UUID in URL correctly', async () => {
    makeRequest.mockResolvedValueOnce({ nickname: 'EncodedUser' });

    const uuid = 'id with spaces+plus';
    await getUserNicknameByUuid(uuid);

    expect(makeRequest).toHaveBeenCalledWith(
      `https://gateway.prod.tt.fm/api/user-service/profile/${encodeURIComponent(uuid)}`,
      { method: 'GET' },
      { Authorization: 'Bearer TEST_BOT_TOKEN' }
    );
  });

  test('throws with clear message when nickname is missing', async () => {
    makeRequest.mockResolvedValueOnce({});
    const uuid = 'no-nickname';

    await expect(getUserNicknameByUuid(uuid))
      .rejects
      .toThrow(`Unable to resolve nickname for UUID ${uuid}: Nickname not found in response`);
  });

  test('throws for invalid UUID (empty string) and does not call makeRequest', async () => {
    await expect(getUserNicknameByUuid(''))
      .rejects
      .toThrow('Unable to resolve nickname for UUID : userUuid must be a non-empty string');
    expect(makeRequest).not.toHaveBeenCalled();
  });

  test('throws for invalid UUID (non-string) and does not call makeRequest', async () => {
    await expect(getUserNicknameByUuid(null))
      .rejects
      .toThrow('Unable to resolve nickname for UUID null: userUuid must be a non-empty string');
    expect(makeRequest).not.toHaveBeenCalled();
  });
});


