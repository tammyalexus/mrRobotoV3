const userJoined = require('../../src/handlers/userJoined');

// Mock the services
jest.mock('../../src/services/serviceContainer.js', () => ({
    messageService: {
        sendGroupMessage: jest.fn().mockResolvedValue(undefined)
    },
    stateService: {
        getHangoutName: jest.fn().mockReturnValue('Test Hangout')
    },
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    },
    data: {
        welcomeMessage: '👋 Welcome to {hangoutName}, {username}!'
    }
}));

const services = require('../../src/services/serviceContainer.js');

describe('userJoined handler', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should send welcome message with correct replacements', async () => {
        const message = {
            statePatch: [{
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            }]
        };

        await userJoined(message);

        expect(services.messageService.sendGroupMessage)
            .toHaveBeenCalledWith('👋 Welcome to Test Hangout, TestUser!');
    });

    it('should use default template if none in data service', async () => {
        // Remove template from data service
        services.data.welcomeMessage = undefined;

        const message = {
            statePatch: [{
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            }]
        };

        await userJoined(message);

        expect(services.messageService.sendGroupMessage)
            .toHaveBeenCalledWith('👋 Welcome to Test Hangout, TestUser!');
    });

    it('should handle missing nickname gracefully', async () => {
        const message = {
            statePatch: [{
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {} // No nickname
                }
            }]
        };

        await userJoined(message);

        expect(services.messageService.sendGroupMessage).not.toHaveBeenCalled();
        expect(services.logger.warn)
            .toHaveBeenCalledWith('No nickname found in user data');
    });

    it('should handle missing userProfile gracefully', async () => {
        const message = {
            statePatch: [{
                op: 'add',
                path: '/allUserData/123-456',
                value: {} // No userProfile
            }]
        };

        await userJoined(message);

        expect(services.messageService.sendGroupMessage).not.toHaveBeenCalled();
        expect(services.logger.warn)
            .toHaveBeenCalledWith('No nickname found in user data');
    });

    it('should handle missing allUserData patch gracefully', async () => {
        const message = {
            statePatch: [{
                op: 'add',
                path: '/someOtherData/123-456',
                value: {}
            }]
        };

        await userJoined(message);

        expect(services.messageService.sendGroupMessage).not.toHaveBeenCalled();
    });

    it('should handle custom welcome message from data service', async () => {
        // Set custom template in data service
        services.data.welcomeMessage = '🎉 Hey {username}, welcome to the amazing {hangoutName}! 🎵';

        const message = {
            statePatch: [{
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            }]
        };

        await userJoined(message);

        expect(services.messageService.sendGroupMessage)
            .toHaveBeenCalledWith('🎉 Hey TestUser, welcome to the amazing Test Hangout! 🎵');
    });

    it('should log error if message sending fails', async () => {
        services.messageService.sendGroupMessage.mockRejectedValueOnce(new Error('Network error'));

        const message = {
            statePatch: [{
                op: 'add',
                path: '/allUserData/123-456',
                value: {
                    userProfile: {
                        nickname: 'TestUser'
                    }
                }
            }]
        };

        await userJoined(message);

        expect(services.logger.error)
            .toHaveBeenCalledWith('Error processing userJoined message:', expect.any(Error));
    });
});
