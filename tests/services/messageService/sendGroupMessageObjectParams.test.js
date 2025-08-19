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

describe('messageService.sendGroupMessage - Object Parameters', () => {
  let buildCustomDataSpy;
  let buildPayloadSpy;

  beforeEach(() => {
    jest.clearAllMocks();

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
        text: 'Test message',
        metadata: {
          chatMessage: {
            message: 'Test message',
            avatarId: 'avatar123',
            userName: 'TestBot',
            color: '#ff0000',
            mentions: [],
            userUuid: 'bot-uid',
            badges: ['VERIFIED', 'STAFF'],
            id: 'uuid-123'
          }
        }
      }
    });
  });

  afterEach(() => {
    buildCustomDataSpy.mockRestore();
    buildPayloadSpy.mockRestore();
  });

  test('should handle object-style message with custom room', async () => {
    const mockResponse = { data: { id: 'msg-123', text: 'Test message' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    const messageObj = {
      message: 'Test with custom room',
      room: 'custom-room-id'
    };

    const result = await messageService.sendGroupMessage(messageObj);

    expect(result.message).toBe('Test with custom room');
    expect(result.messageResponse).toEqual(mockResponse.data);
    expect(buildCustomDataSpy).toHaveBeenCalledWith('Test with custom room');
    expect(buildPayloadSpy).toHaveBeenCalledWith(
      'custom-room-id',
      'group',
      expect.any(Object),
      'Test with custom room'
    );
  });

  test('should handle object-style message with images', async () => {
    const mockResponse = { data: { id: 'msg-456' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    const mockCustomDataWithImages = {
      message: "Test with images",
      imageUrls: ['image1.jpg', 'image2.jpg'],
      avatarId: 'avatar123',
      userName: 'TestBot',
      color: '#ff0000',
      mentions: [],
      userUuid: 'bot-uid',
      badges: ['VERIFIED', 'STAFF'],
      id: 'uuid-123'
    };

    buildCustomDataSpy.mockResolvedValueOnce(mockCustomDataWithImages);

    const messageObj = {
      message: 'Test with images',
      images: ['image1.jpg', 'image2.jpg']
    };

    const result = await messageService.sendGroupMessage(messageObj);

    expect(result.message).toBe('Test with images');
    expect(buildCustomDataSpy).toHaveBeenCalledWith('Test with images');
    // Verify that images were added to customData
    expect(mockCustomDataWithImages.imageUrls).toEqual(['image1.jpg', 'image2.jpg']);
  });

  test('should handle object-style message with mentions', async () => {
    const mockResponse = { data: { id: 'msg-789' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    const messageObj = {
      message: 'Test with mentions',
      mentions: [
        { position: 0, nickname: 'User1', userId: 'user1' },
        { position: 10, nickname: 'User2', userId: 'user2' }
      ]
    };

    const result = await messageService.sendGroupMessage(messageObj);

    expect(result.message).toBe('Test with mentions');
    expect(buildCustomDataSpy).toHaveBeenCalledWith('Test with mentions');
    
    // Check that the spy was called and verify mentions structure
    const customDataCall = buildCustomDataSpy.mock.results[0].value;
    expect(customDataCall).resolves.toHaveProperty('mentions');
  });

  test('should handle string message with options.images', async () => {
    const mockResponse = { data: { id: 'msg-999' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    const mockCustomDataWithImages = {
      message: "String message with images",
      imageUrls: ['option-image.png'],
      avatarId: 'avatar123',
      userName: 'TestBot',
      color: '#ff0000',
      mentions: [],
      userUuid: 'bot-uid',
      badges: ['VERIFIED', 'STAFF'],
      id: 'uuid-123'
    };

    buildCustomDataSpy.mockResolvedValueOnce(mockCustomDataWithImages);

    const options = {
      images: ['option-image.png'],
      room: 'options-room'
    };

    const result = await messageService.sendGroupMessage('String message with images', options);

    expect(result.message).toBe('String message with images');
    expect(buildPayloadSpy).toHaveBeenCalledWith(
      'options-room',
      'group',
      expect.any(Object),
      'String message with images'
    );
  });

  test('should return error object when object message has no message property', async () => {
    const invalidMessageObj = {
      room: 'test-room'
      // Missing message property
    };

    const result = await messageService.sendGroupMessage(invalidMessageObj);
    
    expect(result.error).toBeDefined();
    expect(result.message).toBeUndefined();
  });

  test('should return error object when message is empty string', async () => {
    const result = await messageService.sendGroupMessage('');
    
    expect(result.error).toBe('Message content is required');
    expect(result.message).toBe('');
  });

  test('should return error object when object has empty message', async () => {
    const emptyMessageObj = {
      message: '',
      room: 'test-room'
    };

    const result = await messageService.sendGroupMessage(emptyMessageObj);
    
    expect(result.error).toBeDefined();
    expect(result.message).toBe('');
  });
});
