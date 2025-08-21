const playedSong = require('../../src/handlers/playedSong');

jest.useFakeTimers();

describe('playedSong handler', () => {
  let services;

  beforeEach(() => {
    services = {
      logger: { debug: jest.fn(), error: jest.fn() },
      hangSocketServices: { upVote: jest.fn().mockResolvedValue() },
      hangoutState: {},
      socket: { id: 'socket1' }
    };
    global.playedSongTimer = null;
  });

  afterEach(() => {
    if (global.playedSongTimer) {
      clearTimeout(global.playedSongTimer);
      global.playedSongTimer = null;
    }
    jest.clearAllTimers();
  });

  test('starts timer and calls upVote after 90s if nowPlaying is not null', async () => {
    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong({}, {}, services);
    expect(global.playedSongTimer).not.toBeNull();
    jest.advanceTimersByTime(90000);
    // Wait for async upVote
    await Promise.resolve();
    expect(services.hangSocketServices.upVote).toHaveBeenCalledWith(services.socket);
  });

  test('cancels existing timer and starts new one if nowPlaying is not null', () => {
    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong({}, {}, services);
    const firstTimer = global.playedSongTimer;
    playedSong({}, {}, services);
    expect(global.playedSongTimer).not.toBe(firstTimer);
  });

  test('cancels timer and does not start new one if nowPlaying is null', () => {
    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong({}, {}, services);
    expect(global.playedSongTimer).not.toBeNull();
    services.hangoutState.nowPlaying = null;
    playedSong({}, {}, services);
    expect(global.playedSongTimer).toBeNull();
  });
});
