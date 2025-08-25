const handleWelcomeCommand = require('../../src/commands/handleWelcomeCommand');
const fs = require('fs').promises;
jest.mock('fs');

describe.skip('handleWelcomeCommand', () => {
    let mockServices;
    let mockCommandParams;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock services
        mockServices = {
            messageService: {
                sendGroupMessage: jest.fn()
            },
            dataService: {
                loadData: jest.fn(),
                getAllData: jest.fn().mockReturnValue({ welcomeMessage: 'old message' })
            }
        };

        // Mock fs.promises
        fs.promises = {
            writeFile: jest.fn().mockResolvedValue(undefined)
        };

        // Setup command parameters
        mockCommandParams = {
            command: 'welcome',
            args: 'New welcome message',
            services: mockServices,
            context: {
                sender: 'testUser'
            }
        };
    });

    it('should require args', async () => {
        mockCommandParams.args = '';
        const result = await handleWelcomeCommand(mockCommandParams);

        expect(result.success).toBe(false);
        expect(result.response).toContain('Please provide a new welcome message');
        expect(mockServices.messageService.sendGroupMessage).toHaveBeenCalled();
    });

    it('should update welcome message successfully', async () => {
        const result = await handleWelcomeCommand(mockCommandParams);

        expect(result.success).toBe(true);
        expect(result.response).toContain('New welcome message');
        expect(mockServices.dataService.loadData).toHaveBeenCalledTimes(2);
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('data.json'),
            expect.stringContaining('New welcome message'),
            'utf8'
        );
        expect(mockServices.messageService.sendGroupMessage).toHaveBeenCalled();
    });

    it('should handle errors when updating file', async () => {
        fs.promises.writeFile.mockRejectedValue(new Error('Write error'));

        const result = await handleWelcomeCommand(mockCommandParams);

        expect(result.success).toBe(false);
        expect(result.response).toContain('Failed to update welcome message');
        expect(result.error).toBe('Write error');
        expect(mockServices.messageService.sendGroupMessage).toHaveBeenCalled();
    });
});
