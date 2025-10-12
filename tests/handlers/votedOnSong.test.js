const votedOnSong = require( '../../src/handlers/votedOnSong' );

describe( 'votedOnSong handler', () => {
    let services;

    beforeEach( () => {
        global.previousPlayedSong = null;

        services = {
            logger: {
                debug: jest.fn(),
                error: jest.fn()
            }
        };
    } );

    test( 'should handle no stored previous song gracefully', () => {
        const message = {
            statePatch: [
                { op: 'replace', path: '/voteCounts/likes', value: 5 }
            ]
        };

        expect( () => votedOnSong( message, {}, services ) ).not.toThrow();
        expect( services.logger.debug ).toHaveBeenCalledWith( '[votedOnSong] No previous song stored to update vote counts' );
    } );

    test( 'should update vote counts for stored previous song', () => {
        global.previousPlayedSong = {
            djUuid: 'test-dj',
            artistName: 'Test Artist',
            trackName: 'Test Song',
            voteCounts: { likes: 1, dislikes: 0, stars: 0 }
        };

        const message = {
            statePatch: [
                { op: 'replace', path: '/voteCounts/likes', value: 5 },
                { op: 'replace', path: '/voteCounts/stars', value: 2 }
            ]
        };

        votedOnSong( message, {}, services );

        expect( global.previousPlayedSong.voteCounts ).toEqual( {
            likes: 5,
            dislikes: 0,
            stars: 2
        } );
    } );
} );