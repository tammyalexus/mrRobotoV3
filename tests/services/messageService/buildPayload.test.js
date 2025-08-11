// Mock the modules before importing messageService
jest.mock('../../../src/utils/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('axios');

// Now import the modules that use the mocked dependencies
const { messageService } = require('../../../src/services/messageService.js');
const { logger } = require('../../../src/utils/logging.js');

describe('messageService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('buildCustomData creates expected structure', async () => {
    const fakeReceiver = 'receiver123';
    const fakeReceiverType = 'user';
    const theMessage = 'Hello test';
    const fakeCustomData = {
      message: theMessage,
      avatarId: 'avatar456',
      userName: 'TestBot',
      color: '#FF0000',
      mentions: [],
      userUuid: 'bot-uid',
      badges: [ 'VERIFIED' ],
      id: 'uuid-1234'
    }

    const result = await messageService.buildPayload( fakeReceiver, fakeReceiverType, fakeCustomData, theMessage);

    expect(result).toEqual( {
      receiver: fakeReceiver,
      receiverType: fakeReceiverType,
      category: 'message',
      type: 'text',
      data: {
        text: theMessage,
        metadata: {
          chatMessage: fakeCustomData
        }
      }
    });
  });
});
