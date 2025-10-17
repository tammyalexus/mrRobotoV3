// Integration tests for changeBotName command role-based access control
// These tests verify that the command service properly enforces role restrictions

// Mock all external dependencies
jest.mock( 'fs', () => ( {
  readFileSync: jest.fn().mockReturnValue( JSON.stringify( {
    welcomeMessage: "Hey {username}, welcome to {hangoutName}",
    nowPlayingMessage: "{username} is now playing \"{trackName}\" by {artistName}",
    disabledCommands: [], // Ensure no commands are disabled for role testing
    disabledFeatures: [],
    botData: {
      CHAT_AVATAR_ID: "bot-1",
      CHAT_NAME: "K.D.A.M.",
      CHAT_COLOUR: "ff9900"
    }
  } ) ),
  readdirSync: jest.fn().mockImplementation((dirPath) => {
    // Mock the directory structure based on path
    const normalizedPath = dirPath.replace(/\\/g, '/');
    
    if (normalizedPath.includes('commands/Bot Commands')) {
        return [
            'handleChangebotnameCommand.js',
            'handleCommandCommand.js', 
            'handleFeatureCommand.js',
            'handleStatusCommand.js'
        ];
    } else if (normalizedPath.includes('commands/General Commands')) {
        return [
            'handleEchoCommand.js',
            'handleHelpCommand.js',
            'handlePingCommand.js'
        ];
    } else if (normalizedPath.includes('commands/Debug Commands')) {
        return ['handleStateCommand.js'];
    } else if (normalizedPath.includes('commands/Edit Commands')) {
        return ['handleEditCommand.js'];
    } else if (normalizedPath.includes('commands/ML Commands')) {
        return ['handlePopfactsCommand.js'];
    } else if (normalizedPath.includes('commands') && !normalizedPath.includes('/')) {
        // Root commands directory
        return ['handleUnknownCommand.js'];
    }
    return [];
  }),
  statSync: jest.fn().mockImplementation((filePath) => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Mock folders as directories
    if (normalizedPath.includes('Bot Commands') || 
        normalizedPath.includes('General Commands') ||
        normalizedPath.includes('Debug Commands') ||
        normalizedPath.includes('Edit Commands') ||
        normalizedPath.includes('ML Commands')) {
        return { isDirectory: () => true };
    }
    
    // Mock .js files as files
    if (normalizedPath.endsWith('.js')) {
        return { isDirectory: () => false };
    }
    
    return { isDirectory: () => false };
  }),
  existsSync: jest.fn().mockReturnValue( true )
} ) );

// Mock command modules that need to be loaded by commandService
jest.doMock('../../src/commands/Bot Commands/handleChangebotnameCommand.js', () => {
  const actualCommand = jest.requireActual('../../src/commands/Bot Commands/handleChangebotnameCommand.js');
  return actualCommand;
});

jest.doMock('../../src/commands/handleUnknownCommand.js', () => {
  const actualCommand = jest.requireActual('../../src/commands/handleUnknownCommand.js');
  return actualCommand;
});

jest.mock( '../../src/lib/logging.js', () => ( {
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
} ) );

jest.mock( '../../src/config.js', () => ( {
  COMMAND_SWITCH: '!'
} ) );

const commandService = require( '../../src/services/commandService.js' );
const fs = require( 'fs' );

describe.skip( 'changeBotName command - Role-based Access Control', () => {
  let mockServices;
  let mockContext;

  beforeEach( () => {
    jest.clearAllMocks();

    // Mock all required services
    mockServices = {
      messageService: {
        sendResponse: jest.fn().mockResolvedValue( {} )
      },
      hangUserService: {
        updateHangNickname: jest.fn().mockResolvedValue( {} )
      },
      dataService: {
        setValue: jest.fn().mockResolvedValue( true )
      },
      stateService: {
        getUserRole: jest.fn().mockReturnValue( 'user' ) // Default to user role
      }
    };

    // Mock context for public message
    mockContext = {
      sender: 'testUser',
      fullMessage: {
        isPrivateMessage: false
      }
    };
  } );

  describe( 'OWNER role access', () => {
    beforeEach( () => {
      mockServices.stateService.getUserRole.mockReturnValue( 'owner' );
    } );

    test( 'allows OWNER to change bot name via public message', async () => {
      mockContext.fullMessage.isPrivateMessage = false;

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( true );
      expect( result.shouldRespond ).toBe( true );
      expect( result.response ).toContain( 'NewBotName' );
      expect( mockServices.hangUserService.updateHangNickname ).toHaveBeenCalledWith( 'NewBotName' );
      expect( mockServices.dataService.setValue ).toHaveBeenCalledWith( 'botData.CHAT_NAME', 'NewBotName' );
      expect( mockServices.messageService.sendResponse ).toHaveBeenCalledWith(
        expect.stringContaining( 'NewBotName' ),
        expect.objectContaining( {
          responseChannel: 'request',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        } )
      );
    } );

    test( 'allows OWNER to change bot name via private message', async () => {
      mockContext.fullMessage.isPrivateMessage = true;

      const result = await commandService( 'changebotname', 'NewPrivateBotName', mockServices, mockContext );

      expect( result.success ).toBe( true );
      expect( result.shouldRespond ).toBe( true );
      expect( result.response ).toContain( 'NewPrivateBotName' );
      expect( mockServices.hangUserService.updateHangNickname ).toHaveBeenCalledWith( 'NewPrivateBotName' );
      expect( mockServices.dataService.setValue ).toHaveBeenCalledWith( 'botData.CHAT_NAME', 'NewPrivateBotName' );
      expect( mockServices.messageService.sendResponse ).toHaveBeenCalledWith(
        expect.stringContaining( 'NewPrivateBotName' ),
        expect.objectContaining( {
          responseChannel: 'request',
          isPrivateMessage: true,
          sender: 'testUser',
          services: mockServices
        } )
      );
    } );
  } );

  describe( 'coOwner role access (should be allowed)', () => {
    beforeEach( () => {
      mockServices.stateService.getUserRole.mockReturnValue( 'coOwner' );
    } );

    test( 'allows coOwner to change bot name via public message', async () => {
      mockContext.fullMessage.isPrivateMessage = false;

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( true );
      expect( result.shouldRespond ).toBe( true );
      expect( result.response ).toContain( 'NewBotName' );
      expect( mockServices.hangUserService.updateHangNickname ).toHaveBeenCalledWith( 'NewBotName' );
      expect( mockServices.dataService.setValue ).toHaveBeenCalledWith( 'botData.CHAT_NAME', 'NewBotName' );
      expect( mockServices.messageService.sendResponse ).toHaveBeenCalledWith(
        expect.stringContaining( 'NewBotName' ),
        expect.objectContaining( {
          responseChannel: 'request',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        } )
      );
    } );

    test( 'allows coOwner to change bot name via private message', async () => {
      mockContext.fullMessage.isPrivateMessage = true;

      const result = await commandService( 'changebotname', 'NewPrivateBotName', mockServices, mockContext );

      expect( result.success ).toBe( true );
      expect( result.shouldRespond ).toBe( true );
      expect( result.response ).toContain( 'NewPrivateBotName' );
      expect( mockServices.hangUserService.updateHangNickname ).toHaveBeenCalledWith( 'NewPrivateBotName' );
      expect( mockServices.dataService.setValue ).toHaveBeenCalledWith( 'botData.CHAT_NAME', 'NewPrivateBotName' );
      expect( mockServices.messageService.sendResponse ).toHaveBeenCalledWith(
        expect.stringContaining( 'NewPrivateBotName' ),
        expect.objectContaining( {
          responseChannel: 'request',
          isPrivateMessage: true,
          sender: 'testUser',
          services: mockServices
        } )
      );
    } );
  } );

  describe( 'moderator role access (should be denied)', () => {
    beforeEach( () => {
      mockServices.stateService.getUserRole.mockReturnValue( 'moderator' );
    } );

    test( 'denies moderator access via public message', async () => {
      mockContext.fullMessage.isPrivateMessage = false;

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( false );
      expect( result.shouldRespond ).toBe( true );
      expect( result.error ).toBe( 'Insufficient permissions' );
      expect( result.response ).toContain( 'don\'t have permission to use the "changebotname" command' );
      expect( result.response ).toContain( 'Required role: OWNER' );

      // Verify command handler was never called
      expect( mockServices.hangUserService.updateHangNickname ).not.toHaveBeenCalled();
      expect( mockServices.dataService.setValue ).not.toHaveBeenCalled();

      // Verify denial response was sent via public channel
      expect( mockServices.messageService.sendResponse ).toHaveBeenCalledWith(
        expect.stringContaining( 'don\'t have permission' ),
        expect.objectContaining( {
          responseChannel: 'request',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        } )
      );
    } );

    test( 'denies moderator access via private message', async () => {
      mockContext.fullMessage.isPrivateMessage = true;

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( false );
      expect( result.shouldRespond ).toBe( true );
      expect( result.error ).toBe( 'Insufficient permissions' );
      expect( result.response ).toContain( 'don\'t have permission to use the "changebotname" command' );
      expect( result.response ).toContain( 'Required role: OWNER' );

      // Verify command handler was never called
      expect( mockServices.hangUserService.updateHangNickname ).not.toHaveBeenCalled();
      expect( mockServices.dataService.setValue ).not.toHaveBeenCalled();

      // Verify denial response was sent via private message
      expect( mockServices.messageService.sendResponse ).toHaveBeenCalledWith(
        expect.stringContaining( 'don\'t have permission' ),
        expect.objectContaining( {
          responseChannel: 'request',
          isPrivateMessage: true,
          sender: 'testUser',
          services: mockServices
        } )
      );
    } );
  } );

  describe( 'user role access (should be denied)', () => {
    beforeEach( () => {
      mockServices.stateService.getUserRole.mockReturnValue( 'user' );
    } );

    test( 'denies user access via public message', async () => {
      mockContext.fullMessage.isPrivateMessage = false;

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( false );
      expect( result.shouldRespond ).toBe( true );
      expect( result.error ).toBe( 'Insufficient permissions' );
      expect( result.response ).toContain( 'don\'t have permission to use the "changebotname" command' );
      expect( result.response ).toContain( 'Required role: OWNER' );

      // Verify command handler was never called
      expect( mockServices.hangUserService.updateHangNickname ).not.toHaveBeenCalled();
      expect( mockServices.dataService.setValue ).not.toHaveBeenCalled();

      // Verify denial response was sent via public channel
      expect( mockServices.messageService.sendResponse ).toHaveBeenCalledWith(
        expect.stringContaining( 'don\'t have permission' ),
        expect.objectContaining( {
          responseChannel: 'request',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        } )
      );
    } );

    test( 'denies user access via private message', async () => {
      mockContext.fullMessage.isPrivateMessage = true;

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( false );
      expect( result.shouldRespond ).toBe( true );
      expect( result.error ).toBe( 'Insufficient permissions' );
      expect( result.response ).toContain( 'don\'t have permission to use the "changebotname" command' );
      expect( result.response ).toContain( 'Required role: OWNER' );

      // Verify command handler was never called
      expect( mockServices.hangUserService.updateHangNickname ).not.toHaveBeenCalled();
      expect( mockServices.dataService.setValue ).not.toHaveBeenCalled();

      // Verify denial response was sent via private message
      expect( mockServices.messageService.sendResponse ).toHaveBeenCalledWith(
        expect.stringContaining( 'don\'t have permission' ),
        expect.objectContaining( {
          responseChannel: 'request',
          isPrivateMessage: true,
          sender: 'testUser',
          services: mockServices
        } )
      );
    } );
  } );

  describe( 'Edge cases', () => {
    test( 'handles undefined user role gracefully', async () => {
      mockServices.stateService.getUserRole.mockReturnValue( undefined );

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( false );
      expect( result.shouldRespond ).toBe( true );
      expect( result.error ).toBe( 'Insufficient permissions' );

      // Verify command handler was never called
      expect( mockServices.hangUserService.updateHangNickname ).not.toHaveBeenCalled();
      expect( mockServices.dataService.setValue ).not.toHaveBeenCalled();
    } );

    test( 'handles null user role gracefully', async () => {
      mockServices.stateService.getUserRole.mockReturnValue( null );

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( false );
      expect( result.shouldRespond ).toBe( true );
      expect( result.error ).toBe( 'Insufficient permissions' );

      // Verify command handler was never called
      expect( mockServices.hangUserService.updateHangNickname ).not.toHaveBeenCalled();
      expect( mockServices.dataService.setValue ).not.toHaveBeenCalled();
    } );

    test( 'handles unknown role gracefully', async () => {
      mockServices.stateService.getUserRole.mockReturnValue( 'unknownRole' );

      const result = await commandService( 'changebotname', 'NewBotName', mockServices, mockContext );

      expect( result.success ).toBe( false );
      expect( result.shouldRespond ).toBe( true );
      expect( result.error ).toBe( 'Insufficient permissions' );

      // Verify command handler was never called
      expect( mockServices.hangUserService.updateHangNickname ).not.toHaveBeenCalled();
      expect( mockServices.dataService.setValue ).not.toHaveBeenCalled();
    } );
  } );
} );