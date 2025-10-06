const playedSong = require( '../../src/handlers/playedSong' );

jest.useFakeTimers();

describe( 'playedSong handler', () => {
  let services;

  beforeEach( () => {
    services = {
      logger: { debug: jest.fn(), error: jest.fn() },
      hangSocketServices: { upVote: jest.fn().mockResolvedValue() },
      hangoutState: {},
      socket: { id: 'socket1' },
      messageService: {
        formatMention: jest.fn().mockImplementation( ( uuid ) => `<@uid:${ uuid }>` ),
        sendGroupMessage: jest.fn().mockResolvedValue()
      },
      dataService: {
        getValue: jest.fn().mockImplementation( ( key ) => {
          if ( key === 'nowPlayingMessage' ) {
            return '{username} is now playing {trackName} by {artistName}';
          }
          return null;
        } )
      }
    };
    global.playedSongTimer = null;
  } );

  afterEach( () => {
    if ( global.playedSongTimer ) {
      clearTimeout( global.playedSongTimer );
      global.playedSongTimer = null;
    }
    jest.clearAllTimers();
  } );

  test( 'starts timer and calls upVote after 90s if nowPlaying is not null', async () => {
    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong( {}, {}, services );
    expect( global.playedSongTimer ).not.toBeNull();
    jest.advanceTimersByTime( 90000 );
    // Wait for async upVote
    await Promise.resolve();
    expect( services.hangSocketServices.upVote ).toHaveBeenCalledWith( services.socket );
  } );

  test( 'cancels existing timer and starts new one if nowPlaying is not null', () => {
    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong( {}, {}, services );
    const firstTimer = global.playedSongTimer;
    playedSong( {}, {}, services );
    expect( global.playedSongTimer ).not.toBe( firstTimer );
  } );

  test( 'cancels timer and does not start new one if nowPlaying is null', () => {
    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong( {}, {}, services );
    expect( global.playedSongTimer ).not.toBeNull();
    services.hangoutState.nowPlaying = null;
    playedSong( {}, {}, services );
    expect( global.playedSongTimer ).toBeNull();
  } );

  test( 'should announce new song when all song info is present', async () => {
    const message = {
      statePatch: [
        {
          op: 'replace',
          path: '/djs/0/uuid',
          value: 'f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/artistName',
          value: 'Billy Idol'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/trackName',
          value: 'Cradle Of Love'
        }
      ]
    };

    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong( message, {}, services );

    // Wait for async announcement
    await Promise.resolve();

    expect( services.messageService.formatMention ).toHaveBeenCalledWith( 'f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc' );
    expect( services.messageService.sendGroupMessage ).toHaveBeenCalledWith(
      '<@uid:f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc> is now playing Cradle Of Love by Billy Idol',
      { services }
    );
  } );

  test( 'should not announce song when song info is incomplete', async () => {
    const message = {
      statePatch: [
        {
          op: 'replace',
          path: '/djs/0/uuid',
          value: 'f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/artistName',
          value: 'Billy Idol'
        }
        // Missing trackName
      ]
    };

    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong( message, {}, services );

    // Wait for potential async announcement
    await Promise.resolve();

    expect( services.messageService.sendGroupMessage ).not.toHaveBeenCalled();
  } );

  test( 'should handle announcement errors gracefully', async () => {
    const message = {
      statePatch: [
        {
          op: 'replace',
          path: '/djs/0/uuid',
          value: 'f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/artistName',
          value: 'Billy Idol'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/trackName',
          value: 'Cradle Of Love'
        }
      ]
    };

    services.messageService.sendGroupMessage.mockRejectedValueOnce( new Error( 'Network error' ) );
    services.hangoutState.nowPlaying = { song: 'test' };

    playedSong( message, {}, services );

    // Wait for async announcement and error handling
    await Promise.resolve();
    await Promise.resolve();

    expect( services.logger.error ).toHaveBeenCalledWith( 'Failed to announce song: Network error' );
    // Timer should still work despite announcement error
    expect( global.playedSongTimer ).not.toBeNull();
  } );

  test( 'should use custom template from dataService', async () => {
    // Override the dataService mock to return a custom template
    services.dataService.getValue.mockImplementation( ( key ) => {
      if ( key === 'nowPlayingMessage' ) {
        return '🎵 {username} just started {trackName} by {artistName} 🎵';
      }
      return null;
    } );

    const message = {
      statePatch: [
        {
          op: 'replace',
          path: '/djs/0/uuid',
          value: 'f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/artistName',
          value: 'Billy Idol'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/trackName',
          value: 'Cradle Of Love'
        }
      ]
    };

    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong( message, {}, services );

    // Wait for async announcement
    await Promise.resolve();

    expect( services.messageService.sendGroupMessage ).toHaveBeenCalledWith(
      '🎵 <@uid:f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc> just started Cradle Of Love by Billy Idol 🎵',
      { services }
    );
  } );

  test( 'should use default template when dataService returns null', async () => {
    // Override the dataService mock to return null
    services.dataService.getValue.mockReturnValue( null );

    const message = {
      statePatch: [
        {
          op: 'replace',
          path: '/djs/0/uuid',
          value: 'f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/artistName',
          value: 'Billy Idol'
        },
        {
          op: 'replace',
          path: '/nowPlaying/song/trackName',
          value: 'Cradle Of Love'
        }
      ]
    };

    services.hangoutState.nowPlaying = { song: 'test' };
    playedSong( message, {}, services );

    // Wait for async announcement
    await Promise.resolve();

    expect( services.messageService.sendGroupMessage ).toHaveBeenCalledWith(
      '<@uid:f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc> is now playing Cradle Of Love by Billy Idol',
      { services }
    );
  } );
} );
