const config = require('../config.js');
const { messageService } = require('../services/messageService.js');
const { ServerMessageName, SocketClient, StatefulServerMessageName, StatelessServerMessageName } = require( 'ttfm-socket' );
const { logger } = require('./logging.js');

class Bot {
    constructor( slug ) {
    this.lastMessageIDs = {}
    }

    // ========================================================
    // Connection functions
    // ========================================================

    // async connect( roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions ) {
    async connect( ) {
        logger.debug( 'Connecting to room' )
        await messageService.joinChat( config.HANGOUT_ID )

        this.socket = new SocketClient( 'https://socket.prod.tt.fm' )

        const connection = await this.socket.joinRoom( config.BOT_USER_TOKEN, {
            roomUuid: config.HANGOUT_ID
        } )
        this.state = connection.state

        this.socket.on("reconnect", async () => {
            const { state } = await this.socket.joinRoom( config.BOT_USER_TOKEN, {
            roomUuid: config.HANGOUT_ID
            } );
            this.state = connection.state
        });

    // await startup( process.env.ROOM_UUID, this.state, roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions )
    }

    configureListeners( ) {
        logger.debug( 'Setting up listeners' )

        this.socket.on( 'statefulMessage', async payload => {
            logger.debug( `statefulMessage - ${ payload.name } -------------------------------------------` )
            logger.debug( `error ${ payload.message }` )
        } )

        this.socket.on( "statelessMessage", ( payload ) => {
            logger.debug( `statelessMessage - ${ payload.name } -------------------------------------------` )
            logger.debug( `error ${ payload.message }` )

        } );

        this.socket.on( "serverMessage", ( payload ) => {
            logger.debug( `serverMessage - ${ payload.message.name } -------------------------------------------` )
            logger.debug( `error ${ payload.message }` )
        } );

        this.socket.on( "error", async ( message ) => {
            logger.debug( `error --------------------------------------------` )
            logger.debug( `error ${ message }` )
        } );
    }
}

module.exports = { Bot };
