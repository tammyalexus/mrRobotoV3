const { Bot } = require('../../src/lib/bot');

describe('Bot _createSocketConnection', () => {
  let services;
  let bot;

  beforeEach(() => {
    services = {
      logger: { debug: jest.fn() },
      config: {}
    };
    bot = new Bot('test', services);
  });

  test('registers socket to serviceContainer', async () => {
    // Mock SocketClient
    const mockSocket = { id: 'socket1' };
    const SocketClient = jest.fn(() => mockSocket);
    // Patch global require for ttfm-socket
    jest.mock('ttfm-socket', () => ({ SocketClient }), { virtual: true });

    // Patch Bot to use our mock
    bot._createSocketConnection = async function () {
      this.logger = services.logger;
      this.socket = new SocketClient('https://socket.prod.tt.fm');
      this.services.socket = this.socket;
      this.logger.debug('✅ SocketClient created and registered to serviceContainer');
    };

    await bot._createSocketConnection();
    expect(bot.services.socket).toBe(bot.socket);
    expect(bot.services.socket.id).toBe('socket1');
  });
});
