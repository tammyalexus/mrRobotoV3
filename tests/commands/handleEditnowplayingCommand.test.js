// Mock the fs module before requiring the command
jest.mock( 'fs', () => ( {
    promises: {
        writeFile: jest.fn(),
        readFile: jest.fn()
    }
} ) );

const handleEditnowplayingCommand = require( '../../src/commands/handleEditnowplayingCommand' );
const fs = require( 'fs' );

describe( 'handleEditnowplayingCommand', () => {
    let mockServices;
    let mockCommandParams;

    beforeEach( () => {
        jest.clearAllMocks();
        jest.resetAllMocks();

        mockServices = {
            messageService: {
                sendGroupMessage: jest.fn(),
                sendResponse: jest.fn()
            },
            dataService: {
                loadData: jest.fn().mockResolvedValue(),
                getAllData: jest.fn().mockReturnValue( { nowPlayingMessage: 'old template' } ),
                getValue: jest.fn().mockReturnValue( '{username} plays {trackName} by {artistName}' )  // Return the expected value after update
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
        fs.promises.readFile.mockResolvedValue( JSON.stringify( { nowPlayingMessage: '{username} plays {trackName} by {artistName}' }, null, 2 ) );

        mockCommandParams = {
            command: 'editnowplaying',
            args: '{username} plays {trackName} by {artistName}',
            services: mockServices,
            context: {
                sender: 'testUser'
            }
        };
    } );

    it( 'should require args', async () => {
        mockCommandParams.args = '';
        const result = await handleEditnowplayingCommand( mockCommandParams );

        expect( result.success ).toBe( false );
        expect( result.response ).toContain( 'Please provide a new now playing message template' );
        expect( mockServices.messageService.sendResponse ).toHaveBeenCalled();
    } );

    it( 'should update now playing message template successfully', async () => {
        const result = await handleEditnowplayingCommand( mockCommandParams );

        expect( result.success ).toBe( true );
        expect( result.response ).toContain( '{username} plays {trackName} by {artistName}' );
        expect( mockServices.dataService.loadData ).toHaveBeenCalledTimes( 2 );
        expect( fs.promises.writeFile ).toHaveBeenCalledWith(
            expect.stringContaining( 'data.json' ),
            expect.stringContaining( '{username} plays {trackName} by {artistName}' ),
            'utf8'
        );
        expect( mockServices.messageService.sendResponse ).toHaveBeenCalled();
    } );

    it( 'should handle errors when updating file', async () => {
        // Override the writeFile mock to throw an error for this test
        fs.promises.writeFile.mockImplementation( () => {
            throw new Error( 'Write error' );
        } );

        const result = await handleEditnowplayingCommand( mockCommandParams );

        expect( result.success ).toBe( false );
        expect( result.response ).toContain( 'Failed to update now playing message template' );
        expect( result.error ).toBe( 'Write error' );
        expect( mockServices.messageService.sendResponse ).toHaveBeenCalled();
    } );

    it( 'should handle templates without all tokens', async () => {
        // Test with a template that only uses some tokens
        mockCommandParams.args = 'Now playing: {trackName}';
        mockServices.dataService.getValue.mockReturnValue( 'Now playing: {trackName}' );
        fs.promises.readFile.mockResolvedValue( JSON.stringify( { nowPlayingMessage: 'Now playing: {trackName}' }, null, 2 ) );

        const result = await handleEditnowplayingCommand( mockCommandParams );

        expect( result.success ).toBe( true );
        expect( result.response ).toContain( 'Now playing: {trackName}' );
        expect( mockServices.dataService.loadData ).toHaveBeenCalledTimes( 2 );
    } );

    it( 'should handle templates with no tokens', async () => {
        // Test with a template that uses no tokens at all
        mockCommandParams.args = 'A new song is playing!';
        mockServices.dataService.getValue.mockReturnValue( 'A new song is playing!' );
        fs.promises.readFile.mockResolvedValue( JSON.stringify( { nowPlayingMessage: 'A new song is playing!' }, null, 2 ) );

        const result = await handleEditnowplayingCommand( mockCommandParams );

        expect( result.success ).toBe( true );
        expect( result.response ).toContain( 'A new song is playing!' );
        expect( mockServices.dataService.loadData ).toHaveBeenCalledTimes( 2 );
    } );
} );