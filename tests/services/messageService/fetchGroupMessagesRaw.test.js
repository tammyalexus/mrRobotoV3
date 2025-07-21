const { messageService } = require('../../../src/services/messageService.js');
const cometchatApi = require('../../../src/services/cometchatApi');
jest.mock('../../../src/services/cometchatApi');

describe('fetchGroupMessagesRaw', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns messages when API responds with data', async () => {
    const fakeMessages = [{ id: 1, data: { text: 'Hello' } }];
    cometchatApi.apiClient.get.mockResolvedValue({ data: { data: fakeMessages } });

    const result = await messageService.fetchGroupMessagesRaw([['per_page', 1]]);
    expect(result).toEqual(fakeMessages);
    expect(cometchatApi.apiClient.get).toHaveBeenCalled();
  });

  test('returns empty array when API throws an error', async () => {
    cometchatApi.apiClient.get.mockRejectedValue(new Error('Network error'));

    const result = await messageService.fetchGroupMessagesRaw([['per_page', 1]]);
    expect(result).toEqual([]);
  });
});
