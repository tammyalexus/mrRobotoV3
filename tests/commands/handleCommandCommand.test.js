// Mock fs module
jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    readdirSync: jest.fn(),
    existsSync: jest.fn(),
    statSync: jest.fn()
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

        // Default mocks for new folder structure
        fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: [] }));
        fs.readdirSync.mockImplementation((dirPath) => {
            // Mock the directory structure based on path
            const normalizedPath = dirPath.replace(/\\/g, '/');
            
            if (normalizedPath.includes('commands/General Commands')) {
                return ['handleHelpCommand.js', 'handlePingCommand.js'];
            } else if (normalizedPath.includes('commands/Bot Commands')) {
                return ['handleCommandCommand.js'];
            } else if (normalizedPath.endsWith('/commands')) {
                // Root commands directory - return folders and any root files
                return ['General Commands', 'Bot Commands', 'handleUnknownCommand.js'];
            }
            return [];
        });
        fs.statSync.mockImplementation((filePath) => {
            const normalizedPath = filePath.replace(/\\/g, '/');
            
            // Mock .js files as files first (most specific check)
            if (normalizedPath.endsWith('.js')) {
                return { isDirectory: () => false };
            }
            
            // Mock folders as directories (only if it ends with the folder name, not a file path)
            if (normalizedPath.endsWith('General Commands') || 
                normalizedPath.endsWith('Bot Commands')) {
                return { isDirectory: () => true };
            }
            
            return { isDirectory: () => false };
        });
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
        console.log('Test result:', result);
        expect(result.success).toBe(true);
    });

    test('should enable a command', async () => {
        mockCommandParams.args = 'enable ping';
        fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));
        
        const result = await handleCommandCommand(mockCommandParams);
        expect(result.success).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('should show disabled commands correctly in list', async () => {
        mockCommandParams.args = 'list';
        fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['help', 'ping'] }));
        
        const result = await handleCommandCommand(mockCommandParams);
        expect(result.success).toBe(true);
        expect(result.response).toContain('🔴 **help** - disabled');
        expect(result.response).toContain('🔴 **ping** - disabled');
        expect(result.response).toContain('🟢 **command** - enabled');
        expect(result.response).toContain('🟢 **unknown** - enabled');
    });
});
