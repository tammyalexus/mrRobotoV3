// Integration tests for changeBotName command role-based access control
// These tests verify that the command service properly enforces role restrictions

// Mock all external dependencies
jest.mock('../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../src/config.js', () => ({
  COMMAND_SWITCH: '!'
}));

const commandService = require('../../src/services/commandService.js');

describe('changeBotName command - Role-based Access Control', () => {
  let mockServices;
  let mockContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock all required services
    mockServices = {
      messageService: {
        sendResponse: jest.fn().mockResolvedValue({})
      },
      hangUserService: {
        updateHangNickname: jest.fn().mockResolvedValue({})
      },
      dataService: {
        setValue: jest.fn().mockResolvedValue(true)
      },
      stateService: {
        getUserRole: jest.fn().mockReturnValue('user') // Default to user role
      }
    };

    // Mock context for public message
    mockContext = {
      sender: 'testUser',
      fullMessage: {
        isPrivateMessage: false
      }
    };
  });

  describe('OWNER role access', () => {
    beforeEach(() => {
      mockServices.stateService.getUserRole.mockReturnValue('owner');
    });

    test('allows OWNER to change bot name via public message', async () => {
      mockContext.fullMessage.isPrivateMessage = false;
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('NewBotName');
      expect(mockServices.hangUserService.updateHangNickname).toHaveBeenCalledWith('NewBotName');
      expect(mockServices.dataService.setValue).toHaveBeenCalledWith('botData.CHAT_NAME', 'NewBotName');
      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        expect.stringContaining('NewBotName'),
        expect.objectContaining({
          responseChannel: 'request',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        })
      );
    });

    test('allows OWNER to change bot name via private message', async () => {
      mockContext.fullMessage.isPrivateMessage = true;
      
      const result = await commandService('changebotname', 'NewPrivateBotName', mockServices, mockContext);

      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('NewPrivateBotName');
      expect(mockServices.hangUserService.updateHangNickname).toHaveBeenCalledWith('NewPrivateBotName');
      expect(mockServices.dataService.setValue).toHaveBeenCalledWith('botData.CHAT_NAME', 'NewPrivateBotName');
      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        expect.stringContaining('NewPrivateBotName'),
        expect.objectContaining({
          responseChannel: 'request',
          isPrivateMessage: true,
          sender: 'testUser',
          services: mockServices
        })
      );
    });
  });

  describe('coOwner role access (should be allowed)', () => {
    beforeEach(() => {
      mockServices.stateService.getUserRole.mockReturnValue('coOwner');
    });

    test('allows coOwner to change bot name via public message', async () => {
      mockContext.fullMessage.isPrivateMessage = false;
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('NewBotName');
      expect(mockServices.hangUserService.updateHangNickname).toHaveBeenCalledWith('NewBotName');
      expect(mockServices.dataService.setValue).toHaveBeenCalledWith('botData.CHAT_NAME', 'NewBotName');
      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        expect.stringContaining('NewBotName'),
        expect.objectContaining({
          responseChannel: 'request',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        })
      );
    });

    test('allows coOwner to change bot name via private message', async () => {
      mockContext.fullMessage.isPrivateMessage = true;
      
      const result = await commandService('changebotname', 'NewPrivateBotName', mockServices, mockContext);

      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('NewPrivateBotName');
      expect(mockServices.hangUserService.updateHangNickname).toHaveBeenCalledWith('NewPrivateBotName');
      expect(mockServices.dataService.setValue).toHaveBeenCalledWith('botData.CHAT_NAME', 'NewPrivateBotName');
      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        expect.stringContaining('NewPrivateBotName'),
        expect.objectContaining({
          responseChannel: 'request',
          isPrivateMessage: true,
          sender: 'testUser',
          services: mockServices
        })
      );
    });
  });

  describe('moderator role access (should be denied)', () => {
    beforeEach(() => {
      mockServices.stateService.getUserRole.mockReturnValue('moderator');
    });

    test('denies moderator access via public message', async () => {
      mockContext.fullMessage.isPrivateMessage = false;
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Insufficient permissions');
      expect(result.response).toContain('don\'t have permission to use the "changebotname" command');
      expect(result.response).toContain('Required role: OWNER');
      
      // Verify command handler was never called
      expect(mockServices.hangUserService.updateHangNickname).not.toHaveBeenCalled();
      expect(mockServices.dataService.setValue).not.toHaveBeenCalled();
      
      // Verify denial response was sent via public channel
      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        expect.stringContaining('don\'t have permission'),
        expect.objectContaining({
          responseChannel: 'request',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        })
      );
    });

    test('denies moderator access via private message', async () => {
      mockContext.fullMessage.isPrivateMessage = true;
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Insufficient permissions');
      expect(result.response).toContain('don\'t have permission to use the "changebotname" command');
      expect(result.response).toContain('Required role: OWNER');
      
      // Verify command handler was never called
      expect(mockServices.hangUserService.updateHangNickname).not.toHaveBeenCalled();
      expect(mockServices.dataService.setValue).not.toHaveBeenCalled();
      
      // Verify denial response was sent via private message
      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        expect.stringContaining('don\'t have permission'),
        expect.objectContaining({
          responseChannel: 'request',
          isPrivateMessage: true,
          sender: 'testUser',
          services: mockServices
        })
      );
    });
  });

  describe('user role access (should be denied)', () => {
    beforeEach(() => {
      mockServices.stateService.getUserRole.mockReturnValue('user');
    });

    test('denies user access via public message', async () => {
      mockContext.fullMessage.isPrivateMessage = false;
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Insufficient permissions');
      expect(result.response).toContain('don\'t have permission to use the "changebotname" command');
      expect(result.response).toContain('Required role: OWNER');
      
      // Verify command handler was never called
      expect(mockServices.hangUserService.updateHangNickname).not.toHaveBeenCalled();
      expect(mockServices.dataService.setValue).not.toHaveBeenCalled();
      
      // Verify denial response was sent via public channel
      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        expect.stringContaining('don\'t have permission'),
        expect.objectContaining({
          responseChannel: 'request',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        })
      );
    });

    test('denies user access via private message', async () => {
      mockContext.fullMessage.isPrivateMessage = true;
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Insufficient permissions');
      expect(result.response).toContain('don\'t have permission to use the "changebotname" command');
      expect(result.response).toContain('Required role: OWNER');
      
      // Verify command handler was never called
      expect(mockServices.hangUserService.updateHangNickname).not.toHaveBeenCalled();
      expect(mockServices.dataService.setValue).not.toHaveBeenCalled();
      
      // Verify denial response was sent via private message
      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        expect.stringContaining('don\'t have permission'),
        expect.objectContaining({
          responseChannel: 'request',
          isPrivateMessage: true,
          sender: 'testUser',
          services: mockServices
        })
      );
    });
  });

  describe('Edge cases', () => {
    test('handles undefined user role gracefully', async () => {
      mockServices.stateService.getUserRole.mockReturnValue(undefined);
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Insufficient permissions');
      
      // Verify command handler was never called
      expect(mockServices.hangUserService.updateHangNickname).not.toHaveBeenCalled();
      expect(mockServices.dataService.setValue).not.toHaveBeenCalled();
    });

    test('handles null user role gracefully', async () => {
      mockServices.stateService.getUserRole.mockReturnValue(null);
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Insufficient permissions');
      
      // Verify command handler was never called
      expect(mockServices.hangUserService.updateHangNickname).not.toHaveBeenCalled();
      expect(mockServices.dataService.setValue).not.toHaveBeenCalled();
    });

    test('handles unknown role gracefully', async () => {
      mockServices.stateService.getUserRole.mockReturnValue('unknownRole');
      
      const result = await commandService('changebotname', 'NewBotName', mockServices, mockContext);

      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Insufficient permissions');
      
      // Verify command handler was never called
      expect(mockServices.hangUserService.updateHangNickname).not.toHaveBeenCalled();
      expect(mockServices.dataService.setValue).not.toHaveBeenCalled();
    });
  });
});