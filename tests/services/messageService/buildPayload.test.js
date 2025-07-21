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
