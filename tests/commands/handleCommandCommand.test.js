// Mock fs module
jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    readdirSync: jest.fn(),
    existsSync: jest.fn()
}));

const handleCommandCommand = require('../../src/commands/Bot Commands/handleCommandCommand');
const fs = require('fs');

describe('handleCommandCommand', () => {
    let mockServices;
    let mockCommandParams;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockServices = {
            messageService: {
                sendResponse: jest.fn()
            }
        };

        mockCommandParams = {
            args: '',
            services: mockServices,
            context: {
                fullMessage: { isPrivateMessage: false },
                sender: 'user123'
            },
            responseChannel: 'group'
        };

        // Default mocks
        fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: [] }));
        fs.readdirSync.mockReturnValue(['handleHelpCommand.js', 'handlePingCommand.js']);
        fs.existsSync.mockReturnValue(true);
    });

    test('should handle missing args', async () => {
        const result = await handleCommandCommand(mockCommandParams);
        expect(result.success).toBe(false);
        expect(mockServices.messageService.sendResponse).toHaveBeenCalled();
    });

    test('should list commands', async () => {
        mockCommandParams.args = 'list';
        const result = await handleCommandCommand(mockCommandParams);
        expect(result.success).toBe(true);
    });

    test('should enable a command', async () => {
        mockCommandParams.args = 'enable ping';
        fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));
        
        const result = await handleCommandCommand(mockCommandParams);
        expect(result.success).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });
});
