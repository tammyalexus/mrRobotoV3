const fs = require('fs').promises;
const path = require('path');
const handleChangebotnameCommand = require('../../src/commands/handleChangebotnameCommand.js');

describe('handleChangebotnameCommand', () => {
  let mockServices;
  let mockCommandParams;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock services
    mockServices = {
      messageService: {
        sendGroupMessage: jest.fn().mockResolvedValue({})
      },
      hangUserService: {
        updateHangNickname: jest.fn().mockResolvedValue({})
      },
      dataService: {
        setValue: jest.fn().mockResolvedValue(true)
      }
    };

    // Mock command parameters
    mockCommandParams = {
      args: 'NewBotName',
      services: mockServices,
      context: {
        sender: 'testUser'
      }
    };

    // No need for file operations as they're handled by dataService
  });

  test('changes bot name successfully', async () => {
    const result = await handleChangebotnameCommand(mockCommandParams);

    // Verify successful result
    expect(result.success).toBe(true);
    expect(result.response).toContain('NewBotName');

    // Verify all services were called
    expect(mockServices.hangUserService.updateHangNickname).toHaveBeenCalledWith('NewBotName');
    expect(mockServices.dataService.setValue).toHaveBeenCalledWith('botData.CHAT_NAME', 'NewBotName');
    expect(mockServices.messageService.sendGroupMessage).toHaveBeenCalled();
  });

  test('fails when no name is provided', async () => {
    mockCommandParams.args = '';
    const result = await handleChangebotnameCommand(mockCommandParams);

    expect(result.success).toBe(false);
    expect(result.response).toContain('provide a new name');
    expect(mockServices.hangUserService.updateHangNickname).not.toHaveBeenCalled();
  });

  test('handles updateHangNickname failure', async () => {
    mockServices.hangUserService.updateHangNickname.mockRejectedValue(new Error('API Error'));
    
    const result = await handleChangebotnameCommand(mockCommandParams);

    expect(result.success).toBe(false);
    expect(result.response).toContain('Failed to change bot name');
    expect(result.error).toBe('API Error');
  });

  test('handles file write failure', async () => {
    mockServices.dataService.setValue.mockRejectedValue(new Error('File write failed'));
    
    const result = await handleChangebotnameCommand(mockCommandParams);

    expect(result.success).toBe(false);
    expect(result.response).toContain('Failed to change bot name');
    expect(result.error).toBe('File write failed');
  });
});
