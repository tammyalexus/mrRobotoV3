// Mock the modules before importing messageService
jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('axios');

// Now import the modules that use the mocked dependencies
const axios = require('axios');
const { messageService } = require('../../../src/services/messageService.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService', () => {
  let buildCustomDataSpy;
  let buildPayloadSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock services object for tests
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

    // Spy and mock before each test runs
    buildCustomDataSpy = jest.spyOn(messageService, 'buildCustomData').mockResolvedValue({
      message: "Test message",
      avatarId: 'avatar123',
      userName: 'TestBot',
      color: '#ff0000',
      mentions: [],
      userUuid: 'bot-uid',
      badges: ['VERIFIED', 'STAFF'],
      id: 'uuid-123'
    });

    buildPayloadSpy = jest.spyOn(messageService, 'buildPayload').mockResolvedValue({
      receiver: 'test-group-id',
      receiverType: 'group',
      category: 'message',
      type: 'text',
      data: {
        text: "Test message",
        metadata: {
          chatMessage: { custom: 'data' }
        }
      }
    });
  });

  afterEach(() => {
    buildCustomDataSpy.mockRestore();
    buildPayloadSpy.mockRestore();
  });

  test('sendGroupMessage sends a group message', async () => {
    // Mock axios post response
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "Message sent successfully!"
      }
    });

    // Call sendGroupMessage with test message
    await messageService.sendGroupMessage("Test message");

    // Verify internal helper functions called correctly
    expect(buildCustomDataSpy).toHaveBeenCalledWith("Test message", expect.any(Object));
    expect(buildPayloadSpy).toHaveBeenCalledWith(
      expect.any(String),   // receiver id (string)
      "group",             // receiverType
      expect.any(Object),   // customData object
      "Test message"       // message text
    );

    // Verify axios post was called
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test('sendGroupMessage calls API and completes successfully', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    await messageService.sendGroupMessage('Group hello');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('sendGroupMessage handles API errors and logs error', async () => {
    const error = new Error('Group failed');
    axios.post.mockRejectedValue(error);

    await messageService.sendGroupMessage('Offline');

    // Check for the error message split into parts
    expect(logger.error).toHaveBeenCalledWith('❌ Failed to send group message: Offline');
    expect(logger.error).toHaveBeenCalledWith('Error message: Group failed');
  });

  test('does not use logger.error on successful API call', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    await messageService.sendGroupMessage('Group Hello');

    expect(axios.post).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('calls logger.error on API failure', async () => {
    const error = new Error('API failure');

    axios.post.mockRejectedValue(error);
    await messageService.sendGroupMessage('Oops');

    // Check for the error message split into parts
    expect(logger.error).toHaveBeenCalledWith('❌ Failed to send group message: Oops');
    expect(logger.error).toHaveBeenCalledWith('Error message: API failure');
  });
});
