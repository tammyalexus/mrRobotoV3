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
        expect( result.response ).toContain( '!welcome - Update the welcome message template' );

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
} );