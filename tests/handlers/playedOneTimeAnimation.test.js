const playedOneTimeAnimation = require( '../../src/handlers/playedOneTimeAnimation' );

describe( 'playedOneTimeAnimation handler', () => {
    let services;

    beforeEach( () => {
        global.previousPlayedSong = null;

        services = {
            logger: {
                debug: jest.fn(),
                error: jest.fn(),
                info: jest.fn()
            },
            hangoutState: {
                voteCounts: { likes: 3, dislikes: 1, stars: 2 },
                djs: [ { uuid: 'current-dj-123' } ]
            }
        };
    } );

    test( 'should handle no stored previous song gracefully', () => {
        const message = {
            message: {
                name: 'playedOneTimeAnimation',
                params: { userUuid: 'user-123', animation: 'jump' }
            }
        };

        expect( () => playedOneTimeAnimation( message, {}, services ) ).not.toThrow();
        expect( services.logger.debug ).toHaveBeenCalledWith( '[playedOneTimeAnimation] No previous song stored to update vote counts' );
    } );

    test( 'should update vote counts from hangout state', () => {
        global.previousPlayedSong = {
            djUuid: 'test-dj',
            artistName: 'Test Artist',
            trackName: 'Test Song',
            voteCounts: { likes: 0, dislikes: 0, stars: 0 }
        };

        const message = {
            message: {
                name: 'playedOneTimeAnimation',
                params: { userUuid: 'user-123', animation: 'jump' }
            }
        };

        playedOneTimeAnimation( message, {}, services );

        expect( global.previousPlayedSong.voteCounts ).toEqual( {
            likes: 3,
            dislikes: 1,
            stars: 2
        } );
    } );

    test( 'should handle missing vote counts in hangout state', () => {
        global.previousPlayedSong = {
            djUuid: 'test-dj',
            artistName: 'Test Artist',
            trackName: 'Test Song',
            voteCounts: { likes: 5, dislikes: 2, stars: 1 }
        };

        services.hangoutState = {}; // No voteCounts

        const message = {
            message: {
                name: 'playedOneTimeAnimation',
                params: { userUuid: 'user-123', animation: 'jump' }
            }
        };

        playedOneTimeAnimation( message, {}, services );

        expect( services.logger.debug ).toHaveBeenCalledWith( '[playedOneTimeAnimation] No vote counts found in hangout state' );
    } );

    test( 'should increment stars when snag emoji is detected', () => {
        const message = {
            message: {
                name: 'playedOneTimeAnimation',
                params: {
                    userUuid: 'current-dj-123',
                    animation: 'emoji',
                    emoji: '💜'
                }
            }
        };

        playedOneTimeAnimation( message, {}, services );

        expect( services.hangoutState.voteCounts.stars ).toBe( 3 ); // 2 + 1
        expect( services.logger.info ).toHaveBeenCalledWith( '[playedOneTimeAnimation] Snag emoji 💜 detected - counting as star vote' );
        expect( services.logger.info ).toHaveBeenCalledWith( '[playedOneTimeAnimation] Incremented current song stars from 2 to 3' );
    } );

    test( 'should handle different snag emojis', () => {
        const snagEmojis = [ '💜', '⭐️' ];

        snagEmojis.forEach( ( emoji ) => {
            // Reset state
            services.hangoutState.voteCounts.stars = 5;

            const message = {
                message: {
                    name: 'playedOneTimeAnimation',
                    params: {
                        userUuid: 'current-dj-123',
                        animation: 'emoji',
                        emoji: emoji
                    }
                }
            };

            playedOneTimeAnimation( message, {}, services );

            expect( services.hangoutState.voteCounts.stars ).toBe( 6 );
        } );
    } );

    test( 'should not increment stars for non-snag emojis', () => {
        const message = {
            message: {
                name: 'playedOneTimeAnimation',
                params: {
                    userUuid: 'current-dj-123',
                    animation: 'emoji',
                    emoji: '😀'
                }
            }
        };

        playedOneTimeAnimation( message, {}, services );

        expect( services.hangoutState.voteCounts.stars ).toBe( 2 ); // Unchanged
        expect( services.logger.debug ).toHaveBeenCalledWith( '[playedOneTimeAnimation] Emoji 😀 is not a snag emoji' );
    } );
} );
