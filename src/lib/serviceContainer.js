const StateService = require( '../services/stateService' );
const { logger } = require( './logging' );
const { parseCommands } = require( '../services/parseCommands' );
const CometChatApi = require( '../services/cometchatApi' );
const MessageService = require( '../services/messageService' );

class ServiceContainer {
    constructor ( config ) {
        this.config = config;
        this.logger = logger;
        this.parseCommands = parseCommands;
        this.cometchatApi = new CometChatApi( config );
        this.messageService = new MessageService( this );
        this.hangoutState = null;
    }

    /**
     * Called after socket connection is established and state is received
     */
    initializeStateService () {
        if ( !this.hangoutState ) {
            throw new Error( 'Cannot initialize StateService: hangoutState is not set' );
        }
        this.stateService = new StateService( this.hangoutState, this );
    }

    /**
     * Updates the last message ID in the service container
     * @param {string} messageId - The ID of the last message
     */
    updateLastMessageId ( messageId ) {
        this.lastMessageId = messageId;
    }

    /**
     * Get the service container instance
     */
    getServices () {
        return {
            config: this.config,
            logger: this.logger,
            parseCommands: this.parseCommands,
            cometchatApi: this.cometchatApi,
            messageService: this.messageService,
            stateService: this.stateService,
            socket: this.socket,
            hangoutState: this.hangoutState
        };
    }
}

module.exports = ServiceContainer;
