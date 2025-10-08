// Integration test for command flow: parseCommands -> commandService
const parseCommands = require( '../../src/services/parseCommands.js' );
const commandService = require( '../../src/services/commandService.js' );

// Mock fs promises
jest.mock( 'fs', () => ( {
  promises: {
    appendFile: jest.fn().mockResolvedValue()
  },
  readFileSync: jest.fn().mockReturnValue( JSON.stringify( {
    disabledCommands: [],
    disabledFeatures: [],
    welcomeMessage: "Hey {username}, welcome to {hangoutName}",
    nowPlayingMessage: "{username} is now playing \"{trackName}\" by {artistName}",
    botData: {
      CHAT_AVATAR_ID: "test-avatar",
      CHAT_NAME: "TestBot",
      CHAT_COLOUR: "ff0000"
    }
  } ) ),
  readdirSync: jest.fn().mockReturnValue( [
    'handleChangebotnameCommand.js',
    'handleEchoCommand.js',
    'handleEditnowplayingCommand.js',
    'handleFeatureCommand.js',
    'handleHelpCommand.js',
    'handlePingCommand.js',
    'handleStateCommand.js',
    'handleStatusCommand.js',
    'handleTogglecommandCommand.js',
    'handleUnknownCommand.js',
    'handleWelcomeCommand.js'
  ] )
} ) );

// Mock messageService
const mockMessageService = {
  sendGroupMessage: jest.fn().mockResolvedValue( { success: true } ),
  sendResponse: jest.fn().mockResolvedValue( { success: true } ),
  formatMention: jest.fn().mockImplementation( ( uuid ) => `<@uid:${ uuid }>` )
};

// Mock hangUserService
const mockHangUserService = {
  getUserNicknameByUuid: jest.fn().mockResolvedValue( 'TestUser' )
};

// Mock stateService
const mockStateService = {
  getUserRole: jest.fn().mockReturnValue( 'user' ) // Default to user role for tests
};

// Mock services
const mockServices = {
  messageService: mockMessageService,
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  },
  config: {
    COMMAND_SWITCH: '!'
  },
  stateService: mockStateService,
  hangUserService: mockHangUserService,
  dataService: {
    getValue: jest.fn()
      .mockReturnValue( 'test-value' ),
    getAllData: jest.fn().mockReturnValue( {
      botData: {
        CHAT_AVATAR_ID: 'test-avatar',
        CHAT_NAME: 'TestBot',
        CHAT_COLOUR: 'ff0000'
      }
    } )
  },
  hangoutState: {
    settings: {
      name: "Test Room"
    },
    allUsers: [
      {
        uuid: "testUser",
        tokenRole: "user"
      }
    ],
    voteCounts: {
      likes: 0,
      dislikes: 0,
      stars: 0
    }
  }
};

describe( 'Command Flow Integration', () => {
  beforeEach( () => {
    jest.clearAllMocks();
    mockStateService.getUserRole.mockReturnValue( 'user' ); // Reset to default user role
  } );

  test( 'should parse command and process it through commandService', async () => {
    // Step 1: Parse the command
    const parseResult = await parseCommands( '!help', mockServices );

    expect( parseResult ).toEqual( {
      isCommand: true,
      command: 'help',
      remainder: '',
      originalText: '!help'
    } );

    // Step 2: Process the command through commandService
    const context = {
      sender: 'testUser',
      fullMessage: {},
      chatMessage: '!help'
    };

    const commandResult = await commandService(
      parseResult.command,
      parseResult.remainder,
      mockServices,
      context
    );

    expect( commandResult.success ).toBe( true );
    expect( commandResult.shouldRespond ).toBe( true );
    expect( commandResult.response ).toContain( 'Available Commands' );
    expect( mockMessageService.sendResponse ).toHaveBeenCalledWith(
      expect.stringContaining( 'Available Commands' ),
      expect.objectContaining( {
        responseChannel: 'request',
        services: mockServices
      } )
    );
  } );

  test( 'should parse command with arguments and process through commandService', async () => {
    // Step 1: Parse the command with arguments
    const parseResult = await parseCommands( '!echo Hello World', mockServices );

    expect( parseResult ).toEqual( {
      isCommand: true,
      command: 'echo',
      remainder: 'Hello World',
      originalText: '!echo Hello World'
    } );

    // Step 2: Process the command through commandService
    const context = {
      sender: 'testUser',
      fullMessage: {},
      chatMessage: '!echo Hello World'
    };

    const commandResult = await commandService(
      parseResult.command,
      parseResult.remainder,
      mockServices,
      context
    );

    expect( commandResult.success ).toBe( true );
    expect( commandResult.shouldRespond ).toBe( true );
    expect( commandResult.response ).toContain( 'Hello World' );
    expect( mockMessageService.sendResponse ).toHaveBeenCalledWith(
      expect.stringContaining( 'Hello World' ),
      expect.objectContaining( {
        responseChannel: 'public',
        services: mockServices
      } )
    );
  } );

  test( 'should return false for non-commands and not call commandService', async () => {
    // Step 1: Parse non-command message
    const parseResult = await parseCommands( 'Hello everyone', mockServices );

    expect( parseResult ).toBe( false );

    // commandService should not be called for non-commands
    // This simulates what _handleMessage does
    if ( parseResult && parseResult.isCommand ) {
      // This should not execute
      expect( true ).toBe( false );
    }

    expect( mockMessageService.sendResponse ).not.toHaveBeenCalled();
  } );

  test( 'should handle unknown commands gracefully', async () => {
    // Step 1: Parse unknown command
    const parseResult = await parseCommands( '!unknown', mockServices );

    expect( parseResult ).toEqual( {
      isCommand: true,
      command: 'unknown',
      remainder: '',
      originalText: '!unknown'
    } );

    // Step 2: Process unknown command through commandService
    const context = {
      sender: 'testUser',
      fullMessage: {},
      chatMessage: '!unknown'
    };

    const commandResult = await commandService(
      parseResult.command,
      parseResult.remainder,
      mockServices,
      context
    );

    expect( commandResult.success ).toBe( false );
    expect( commandResult.shouldRespond ).toBe( true );
    expect( commandResult.error ).toBe( 'Unknown command' );
    expect( commandResult.response ).toContain( 'Unknown command' );
    expect( mockMessageService.sendResponse ).toHaveBeenCalledWith(
      expect.stringContaining( 'Unknown command' ),
      expect.objectContaining( {
        responseChannel: 'request',
        services: mockServices
      } )
    );
  } );

  test( 'should allow owner commands for owner role', async () => {
    mockStateService.getUserRole.mockReturnValueOnce( 'owner' );

    const parseResult = await parseCommands( '!state', mockServices );
    const context = {
      sender: 'ownerUser',
      fullMessage: {},
      chatMessage: '!state'
    };

    const commandResult = await commandService(
      parseResult.command,
      parseResult.remainder,
      mockServices,
      context
    );

    expect( commandResult.success ).toBe( true );
    expect( commandResult.shouldRespond ).toBe( true );
  } );

  test( 'should deny owner commands for user role', async () => {
    mockStateService.getUserRole.mockReturnValueOnce( 'user' );

    const parseResult = await parseCommands( '!state', mockServices );
    const context = {
      sender: 'regularUser',
      fullMessage: {},
      chatMessage: '!state'
    };

    const commandResult = await commandService(
      parseResult.command,
      parseResult.remainder,
      mockServices,
      context
    );

    expect( commandResult.success ).toBe( false );
    expect( commandResult.shouldRespond ).toBe( true );
    expect( commandResult.error ).toBe( 'Insufficient permissions' );
    expect( commandResult.response ).toContain( 'don\'t have permission' );
  } );
} );
