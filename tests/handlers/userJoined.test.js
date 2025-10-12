const userJoined = require( '../../src/handlers/userJoined' );

// Mock the services
jest.mock( '../../src/services/serviceContainer.js', () => ( {
    messageService: {
        sendGroupMessage: jest.fn().mockResolvedValue( undefined ),
        formatMention: jest.fn().mockImplementation( ( uuid ) => `<@uid:${ uuid }>` )
    },
    stateService: {
        getHangoutName: jest.fn().mockReturnValue( 'Test Hangout' )
    },
    dataService: {
        getValue: jest.fn().mockImplementation( ( key ) => {
            if ( key === 'welcomeMessage' ) {
                return services.data.welcomeMessage;
            }
            return null;
        } )
    },
    featuresService: {
        isFeatureEnabled: jest.fn().mockReturnValue( true ) // Default to enabled for existing tests
    },
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    },
    data: {
        welcomeMessage: "Hi {username}, welcome to '{hangoutName}'"
    }
} ) );

const services = require( '../../src/services/serviceContainer.js' );

describe( 'userJoined handler', () => {
    beforeEach( () => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    } );

    it( 'should send welcome message with correct replacements', async () => {
        const message = {
            statePatch: [ {
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            } ]
        };

        await userJoined( message, {}, services );

        expect( services.messageService.sendGroupMessage )
            .toHaveBeenCalledWith( "Hi <@uid:123-456>, welcome to 'Test Hangout'", { services } );
    } );

    it( 'should use default template if none in data service', async () => {
        // Remove template from data service
        services.data.welcomeMessage = undefined;

        const message = {
            statePatch: [ {
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            } ]
        };

        await userJoined( message, {}, services );

        expect( services.messageService.sendGroupMessage )
            .toHaveBeenCalledWith( "👋 Welcome to Test Hangout, <@uid:123-456>!", { services } );
    } );

    it( 'should handle missing nickname gracefully', async () => {
        const message = {
            statePatch: [ {
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {} // No nickname
                }
            } ]
        };

        await userJoined( message, {}, services );

        expect( services.messageService.sendGroupMessage ).not.toHaveBeenCalled();
        expect( services.logger.warn )
            .toHaveBeenCalledWith( 'No nickname found in user data' );
    } );

    it( 'should handle missing userProfile gracefully', async () => {
        const message = {
            statePatch: [ {
                op: 'add',
                path: '/allUserData/123-456',
                value: {} // No userProfile
            } ]
        };

        await userJoined( message, {}, services );

        expect( services.messageService.sendGroupMessage ).not.toHaveBeenCalled();
        expect( services.logger.warn )
            .toHaveBeenCalledWith( 'No nickname found in user data' );
    } );

    it( 'should handle missing allUserData patch gracefully', async () => {
        const message = {
            statePatch: [ {
                op: 'add',
                path: '/someOtherData/123-456',
                value: {}
            } ]
        };

        await userJoined( message, {}, services );

        expect( services.messageService.sendGroupMessage ).not.toHaveBeenCalled();
    } );

    it( 'should handle custom welcome message from data service', async () => {
        // Set custom template in data service
        services.data.welcomeMessage = '🎉 Hey {username}, welcome to the amazing {hangoutName}! 🎵';

        const message = {
            statePatch: [ {
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            } ]
        };

        await userJoined( message, {}, services );

        expect( services.messageService.sendGroupMessage )
            .toHaveBeenCalledWith( '🎉 Hey <@uid:123-456>, welcome to the amazing Test Hangout! 🎵', { services } );
    } );

    it( 'should log error if message sending fails', async () => {
        services.messageService.sendGroupMessage.mockRejectedValueOnce( new Error( 'Network error' ) );

        const message = {
            statePatch: [ {
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            } ]
        };

        await userJoined( message, {}, services );

        expect( services.logger.error )
            .toHaveBeenCalledWith( 'Error processing userJoined message: Network error' );
    } );

    it( 'should skip welcome message for ghost users', async () => {
        const message = {
            statePatch: [ {
                op: 'add',
                path: '/allUserData/2ec32e47-36e5-40cf-8b49-a777a4a10848',
                value: {
                    userProfile: {
                        color: "#FFFFFF",
                        nickname: "ghost-267",
                        uuid: "2ec32e47-36e5-40cf-8b49-a777a4a10848",
                        avatarId: "ghost"
                    },
                    position: {
                        x: 12.2,
                        y: 75.8
                    },
                    songVotes: {}
                }
            } ]
        };

        await userJoined( message, {}, services );

        expect( services.messageService.sendGroupMessage ).not.toHaveBeenCalled();
        expect( services.logger.debug )
            .toHaveBeenCalledWith( 'Skipping welcome message for ghost user: 2ec32e47-36e5-40cf-8b49-a777a4a10848 (nickname: ghost-267)' );
    } );

    it( 'should not send welcome message when welcomeMessage feature is disabled', async () => {
        // Mock feature as disabled
        services.featuresService.isFeatureEnabled.mockReturnValue( false );

        const message = {
            statePatch: [ {
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            } ]
        };

        const state = { someState: true };

        await userJoined( message, state, services );

        // Should check if feature is enabled
        expect( services.featuresService.isFeatureEnabled ).toHaveBeenCalledWith( 'welcomeMessage' );
        
        // Should not send welcome message when feature is disabled
        expect( services.messageService.sendGroupMessage ).not.toHaveBeenCalled();
        
        // Should log that feature is disabled
        expect( services.logger.debug ).toHaveBeenCalledWith( 'Welcome message feature is disabled, skipping welcome message' );
    } );
} );
