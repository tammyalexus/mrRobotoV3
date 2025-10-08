// Mock the fs module before requiring the command
jest.mock('fs', () => ({
    promises: {
        writeFile: jest.fn(),
        readFile: jest.fn()
    }
}));

const handleEditwelcomeCommand = require('../../src/commands/handleEditwelcomeCommand');
const fs = require('fs');

describe('handleEditwelcomeCommand', () => {
    let mockServices;
    let mockCommandParams;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();

        mockServices = {
            messageService: {
                sendGroupMessage: jest.fn(),
                sendResponse: jest.fn()
            },
            dataService: {
                loadData: jest.fn().mockResolvedValue(),
                getAllData: jest.fn().mockReturnValue({ welcomeMessage: 'old message' }),
                getValue: jest.fn().mockReturnValue('New welcome message')  // Return the expected value after update
            },
            logger: {
                info: jest.fn(),
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            }
        };

        // Mock fs.promises methods
        fs.promises.writeFile.mockResolvedValue();
        fs.promises.readFile.mockResolvedValue(JSON.stringify({ welcomeMessage: 'New welcome message' }, null, 2));

        mockCommandParams = {
            command: 'editwelcome',
            args: 'New welcome message',
            services: mockServices,
            context: {
                sender: 'testUser'
            }
        };
    });

    it('should require args', async () => {
        mockCommandParams.args = '';
        const result = await handleEditwelcomeCommand(mockCommandParams);

        expect(result.success).toBe(false);
        expect(result.response).toContain('Please provide a new welcome message');
        expect(mockServices.messageService.sendResponse).toHaveBeenCalled();
    });

    it('should update welcome message successfully', async () => {
        const result = await handleEditwelcomeCommand(mockCommandParams);

        expect(result.success).toBe(true);
        expect(result.response).toContain('New welcome message');
        expect(mockServices.dataService.loadData).toHaveBeenCalledTimes(2);
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('data.json'),
            expect.stringContaining('New welcome message'),
            'utf8'
        );
        expect(mockServices.messageService.sendResponse).toHaveBeenCalled();
    });

    it('should handle errors when updating file', async () => {
        // Override the writeFile mock to throw an error for this test
        fs.promises.writeFile.mockImplementation(() => {
            throw new Error('Write error');
        });

        const result = await handleEditwelcomeCommand(mockCommandParams);

        expect(result.success).toBe(false);
        expect(result.response).toContain('Failed to update welcome message');
        expect(result.error).toBe('Write error');
        expect(mockServices.messageService.sendResponse).toHaveBeenCalled();
    });
});
