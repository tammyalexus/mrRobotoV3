// Mock the Logger module
jest.mock('../../src/lib/logging', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
    }
}));

// Mock the CometChatApi module
jest.mock('../../src/services/cometchatApi', () => {
    return jest.fn().mockImplementation(() => ({
        // Add any methods that CometChatApi uses
    }));
});

// Mock the MessageService module
jest.mock('../../src/services/messageService', () => {
    return jest.fn().mockImplementation(() => ({
        // Add any methods that MessageService uses
    }));
});

// Mock parseCommands
jest.mock('../../src/services/parseCommands', () => ({
    parseCommands: jest.fn()
}));

const ServiceContainer = require('../../src/lib/serviceContainer');

describe('ServiceContainer', () => {
    let container;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            HANGOUT_ID: 'test-hangout-123',
            BOT_USER_TOKEN: 'test-bot-token-456',
            BOT_UID: 'test-bot-uid-789',
            COMMAND_SWITCH: '!',
            SOCKET_MESSAGE_LOG_LEVEL: 'ON'
        };
        container = new ServiceContainer(mockConfig);
    });

    test('should initialize with config and basic services', () => {
        expect(container.config).toBe(mockConfig);
        expect(container.logger).toBeDefined();
        expect(container.parseCommands).toBeDefined();
        expect(container.cometchatApi).toBeDefined();
        expect(container.messageService).toBeDefined();
        expect(container.hangoutState).toBeNull();
    });

    test('initializeStateService should throw error if hangoutState is not set', () => {
        expect(() => container.initializeStateService()).toThrow('Cannot initialize StateService: hangoutState is not set');
    });

    test('initializeStateService should create stateService when hangoutState is set', () => {
        const mockState = {
            allUsers: [],
            djs: [],
            settings: {}
        };
        container.hangoutState = mockState;
        container.initializeStateService();
        
        expect(container.stateService).toBeDefined();
        expect(container.stateService.hangoutState).toBe(mockState);
    });

    test('updateLastMessageId should update lastMessageId', () => {
        const messageId = '123';
        container.updateLastMessageId(messageId);
        expect(container.lastMessageId).toBe(messageId);
    });

    test('getServices should return all services', () => {
        const services = container.getServices();
        expect(services).toEqual({
            config: container.config,
            logger: container.logger,
            parseCommands: container.parseCommands,
            cometchatApi: container.cometchatApi,
            messageService: container.messageService,
            stateService: container.stateService,
            socket: container.socket,
            hangoutState: container.hangoutState
        });
    });
});
