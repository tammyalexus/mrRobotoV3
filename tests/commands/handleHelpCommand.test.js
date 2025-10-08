// Mock config module to avoid environment dependencies
jest.mock( '../../src/config.js', () => ( {
  COMMAND_SWITCH: '!',
  COMETCHAT_API_KEY: 'test-api-key',
  COMETCHAT_AUTH_TOKEN: 'test-auth-token',
  LOG_LEVEL: 'INFO',
  SOCKET_MESSAGE_LOG_LEVEL: 'OFF',
  BOT_UID: 'test-bot-uid',
  HANGOUT_ID: 'test-hangout-id',
  BOT_USER_TOKEN: 'test-bot-token',
  CHAT_AVATAR_ID: 'test-avatar',
  CHAT_NAME: 'TestBot',
  CHAT_COLOUR: 'ff0000',
  COMETCHAT_RECEIVER_UID: 'test-receiver-uid',
  TTFM_GATEWAY_BASE_URL: 'http://test.example.com'
} ) );

// Mock logging module to prevent file system operations
jest.mock( '../../src/lib/logging.js', () => ( {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  verbose: jest.fn()
} ) );

// Mock fs module to prevent reading actual data.json file
jest.mock( 'fs', () => ( {
  readFileSync: jest.fn().mockImplementation( ( filePath ) => {
    // Return mock data.json content for any data.json path
    if ( filePath.includes( 'data.json' ) ) {
      return JSON.stringify( {
        disabledCommands: [],
        disabledFeatures: [],
        welcomeMessage: "Hey {username}, welcome to {hangoutName}",
        nowPlayingMessage: "{username} is now playing \"{trackName}\" by {artistName}",
        botData: {
          CHAT_AVATAR_ID: "test-avatar",
          CHAT_NAME: "TestBot",
          CHAT_COLOUR: "ff0000"
        }
      } );
    }
    // Default fallback for other files
    return '{}';
  } ),
  readdirSync: jest.fn().mockReturnValue( [
    'handleChangebotnameCommand.js',
    'handleEchoCommand.js',
    'handleEditnowplayingCommand.js',
    'handleEditwelcomeCommand.js',
    'handleFeatureCommand.js',
    'handleHelpCommand.js',
    'handlePingCommand.js',
    'handleStateCommand.js',
    'handleStatusCommand.js',
    'handleCommandCommand.js',
    'handleUnknownCommand.js'
  ] ),
  existsSync: jest.fn().mockReturnValue( true ),
  mkdirSync: jest.fn()
} ) );

const handleHelpCommand = require( '../../src/commands/handleHelpCommand' );

describe( 'handleHelpCommand', () => {
    let mockServices;
    let mockCommandParams;

    beforeEach( () => {
        jest.clearAllMocks();

        mockServices = {
            messageService: {
                sendResponse: jest.fn()
            },
            logger: {
                info: jest.fn(),
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            }
        };

        mockCommandParams = {
            command: 'help',
            args: '',
            services: mockServices,
            context: {
                sender: 'testUser'
            }
        };
    } );

    it( 'should return available commands organized by role', async () => {
        const result = await handleHelpCommand( mockCommandParams );

        expect( result.success ).toBe( true );
        expect( result.response ).toContain( '🤖 Available Commands:' );
        expect( result.response ).toContain( '👤 User Commands:' );
        expect( result.response ).toContain( '🛡️ Moderator Commands:' );
        expect( result.response ).toContain( '👑 Owner Commands:' );
        expect( mockServices.messageService.sendResponse ).toHaveBeenCalled();
    } );

    it( 'should include expected commands in correct sections', async () => {
        const result = await handleHelpCommand( mockCommandParams );

        // Check for User commands
        expect( result.response ).toContain( '!echo - Echo back your message' );
        expect( result.response ).toContain( '!help - Show this help message' );
        expect( result.response ).toContain( '!ping - Check if bot is responding' );
        expect( result.response ).toContain( '!status - Show bot status' );

        // Check for Moderator commands
        expect( result.response ).toContain( '!editnowplaying - Update the now playing message template' );
        expect( result.response ).toContain( '!editwelcome - Update the welcome message template' );

        // Check for Owner commands
        expect( result.response ).toContain( '!changebotname - Change the bot name' );
        expect( result.response ).toContain( '!state - Dump current hangout state to log file' );
    } );

    it( 'should not include hidden commands', async () => {
        const result = await handleHelpCommand( mockCommandParams );

        // The unknown command should be hidden and not appear in help
        expect( result.response ).not.toContain( 'unknown' );
    } );

    it( 'should handle errors gracefully', async () => {
        // Mock fs.readdirSync to throw an error
        const fs = require( 'fs' );
        const originalReaddirSync = fs.readdirSync;
        fs.readdirSync = jest.fn().mockImplementation( () => {
            throw new Error( 'File system error' );
        } );

        const result = await handleHelpCommand( mockCommandParams );

        expect( result.success ).toBe( false );
        expect( result.response ).toContain( '❌ Error loading help information' );
        expect( mockServices.messageService.sendResponse ).toHaveBeenCalled();

        // Restore original function
        fs.readdirSync = originalReaddirSync;
    } );

    it( 'should sort commands alphabetically within each role', async () => {
        const result = await handleHelpCommand( mockCommandParams );

        // Check that user commands are in alphabetical order
        const userSection = result.response.split( '👤 User Commands:' )[ 1 ].split( '🛡️ Moderator Commands:' )[ 0 ];
        const userCommands = userSection.match( /!(\w+)/g );

        if ( userCommands && userCommands.length > 1 ) {
            const commandNames = userCommands.map( cmd => cmd.substring( 1 ) ); // Remove the '!'
            const sortedNames = [ ...commandNames ].sort();
            expect( commandNames ).toEqual( sortedNames );
        }
    } );

    it( 'should show specific command help when a command is provided as argument', async () => {
        mockCommandParams.args = 'echo';

        const result = await handleHelpCommand( mockCommandParams );

        expect( result.success ).toBe( true );
        expect( result.response ).toContain( 'Help for command: !echo' );
        expect( result.response ).toContain( 'Description: Echo back your message' );
        expect( result.response ).toContain( 'Example: !echo Hello everyone!' );
        expect( result.response ).toContain( 'Required Role: USER' );
        expect( mockServices.messageService.sendResponse ).toHaveBeenCalled();
    } );

    it( 'should show error message for non-existent command', async () => {
        mockCommandParams.args = 'nonexistent';

        const result = await handleHelpCommand( mockCommandParams );

        expect( result.success ).toBe( false );
        expect( result.response ).toContain( 'Command "nonexistent" does not exist' );
        expect( result.response ).toContain( 'Type !help to see all available commands' );
        expect( result.error ).toContain( 'Command "nonexistent" not found' );
        expect( mockServices.messageService.sendResponse ).toHaveBeenCalled();
    } );

    it( 'should handle case-insensitive command names', async () => {
        mockCommandParams.args = 'ECHO';

        const result = await handleHelpCommand( mockCommandParams );

        expect( result.success ).toBe( true );
        expect( result.response ).toContain( 'Help for command: !echo' );
        expect( result.response ).toContain( 'Example: !echo Hello everyone!' );
    } );

    it( 'should show specific help for owner commands', async () => {
        mockCommandParams.args = 'changebotname';

        const result = await handleHelpCommand( mockCommandParams );

        expect( result.success ).toBe( true );
        expect( result.response ).toContain( 'Help for command: !changebotname' );
        expect( result.response ).toContain( 'Description: Change the bot name' );
        expect( result.response ).toContain( 'Example: !changebotname MyAwesomeBot' );
        expect( result.response ).toContain( 'Required Role: OWNER' );
    } );

    it( 'should include tip about specific help in general help', async () => {
        const result = await handleHelpCommand( mockCommandParams );

        expect( result.success ).toBe( true );
        expect( result.response ).toContain( 'Type !help [command] to see specific examples and usage' );
    } );
} );