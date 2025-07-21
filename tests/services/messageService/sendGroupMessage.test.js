const axios = require('axios');
const { messageService } = require('../../../src/services/messageService.js');

jest.mock('axios');

describe('messageService', () => {
  let logSpy;
  let buildCustomDataSpy;
  let buildPayloadSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

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
    logSpy.mockRestore();
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
    expect(buildCustomDataSpy).toHaveBeenCalledWith("Test message");
    expect(buildPayloadSpy).toHaveBeenCalledWith(
      expect.any(String),   // receiver id (string)
      "group",             // receiverType
      expect.any(Object),   // customData object
      "Test message"       // message text
    );

    // Verify axios post was called
    expect(axios.post).toHaveBeenCalledTimes(1);

    // Verify console log contains confirmation message
    // expect(logSpy.mock.calls[0][0]).toEqual(expect.stringContaining('✅ Group message sent:'));
  });
});
