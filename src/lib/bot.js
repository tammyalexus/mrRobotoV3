const { ServerMessageName, SocketClient, StatefulServerMessageName, StatelessServerMessageName } = require( 'ttfm-socket' );
const { applyPatch } = require( 'fast-json-patch' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );

class Bot {
  constructor ( slug, services ) {
    this.services = services;
    this.lastMessageIDs = {}
    this.socketLogCounter = 0; // Counter for debug mode logging
    this.deferredPatches = []; // Store patches that arrive before state is available
  }

  // ========================================================
  // Socket Message File Logging Helper
  // ========================================================

  async _writeSocketMessagesToLogFile ( filename, data ) {
    const logLevel = this.services.config.SOCKET_MESSAGE_LOG_LEVEL;

    // If logging is OFF, don't log anything
    if ( logLevel === 'OFF' ) {
      return;
    }

    try {
      const logsDir = path.join( process.cwd(), 'logs' );
      let filePath;

      if ( logLevel === 'DEBUG' ) {
        // In DEBUG mode, each message gets its own numbered file with message name
        this.socketLogCounter++;
        const baseFilename = filename.replace( '.log', '' );
        const paddedCounter = String( this.socketLogCounter ).padStart( 6, '0' );

        // Extract message name from data
        let messageName = '';
        if ( data && typeof data === 'object' ) {
          // For different message types, the name might be in different places
          messageName = data.name || ( data.message && data.message.name ) || '';
        }

        let debugFilename;
        if ( messageName ) {
          debugFilename = `${ paddedCounter }_${ baseFilename }_${ messageName }.log`;
        } else {
          debugFilename = `${ paddedCounter }_${ baseFilename }.log`;
        }

        filePath = path.join( logsDir, debugFilename );
      } else {
        // In ON mode, use the original filename
        filePath = path.join( logsDir, filename );
      }

      const timestamp = new Date().toISOString();
      const logEntry = `${ timestamp }: ${ JSON.stringify( data, null, 2 ) }\n`;

      await fs.appendFile( filePath, logEntry );
    } catch ( error ) {
      this.services.logger.error( `Failed to write to log file ${ filename }: ${ error.message }` );
    }
  }

  // ========================================================
  // Main Connection Flow
  // ========================================================

  async connect () {
    // Data is already loaded and available in serviceContainer as services.data
    this.services.logger.debug( 'Using data loaded in serviceContainer' );

    // First create the socket connection
    await this._createSocketConnection();

    // CRITICAL: Add a small delay to ensure socket is fully initialized
    this.services.logger.debug( 'Allowing socket initialization to complete...' );
    await new Promise( resolve => setTimeout( resolve, 250 ) );

    this.services.logger.debug( 'Setting up listeners...' );
    this._setupErrorListener();
    this._setupStatefulMessageListener();
    this._setupStatelessMessageListener();
    this._setupServerMessageListener();

    // CRITICAL: Add another delay to ensure all listeners are registered
    this.services.logger.debug( 'Ensuring all listeners are registered...' );
    await new Promise( resolve => setTimeout( resolve, 250 ) );

    // Join room and wait for initial state to be available
    await this._joinSocketRoom();

    // Join CometChat after socket connection is established
    await this._joinCometChat();

    // Initialize lastMessageIDs from service container state AFTER connections are established
    await this._initializeMessageTracking();

    // Finally set up reconnect handler
    this._setupReconnectHandler();
  }

  // ========================================================
  // Deferred Patch Handling
  // ========================================================

  async _applyDeferredPatches () {
    if ( this.deferredPatches.length === 0 ) {
      return;
    }

    this.services.logger.debug( `Applying ${ this.deferredPatches.length } deferred patches...` );

    for ( const deferredPatch of this.deferredPatches ) {
      try {
        await this._applyStatePatch( deferredPatch.message, deferredPatch.statePatch );
      } catch ( error ) {
        this.services.logger.error( `Failed to apply deferred patch for ${ deferredPatch.message.name }: ${ error.message }` );
      }
    }

    // Clear deferred patches after applying
    this.deferredPatches = [];
    this.services.logger.debug( 'All deferred patches applied and cleared' );
  }

  async _applyStatePatch ( message, statePatch ) {
    // Validate that we have state before applying patches
    if ( !this.state ) {
      throw new Error( 'Cannot apply patch - state not available' );
    }

    const validOperations = statePatch.filter( operation => {
      try {
        // For remove operations, check if the path exists
        if ( operation.op === 'remove' ) {
          const pathParts = operation.path.split( '/' ).slice( 1 ); // Remove empty first element
          let current = this.state;

          // Traverse the path to see if it exists
          for ( const part of pathParts ) {
            if ( current && typeof current === 'object' && part in current ) {
              current = current[ part ];
            } else {
              this.services.logger.debug( `Skipping remove operation - path does not exist: ${ operation.path }` );
              return false; // Skip this operation
            }
          }
        }
        return true; // Operation is valid
      } catch ( validateError ) {
        this.services.logger.debug( `Skipping invalid operation: ${ JSON.stringify( operation ) } - ${ validateError.message }` );
        return false;
      }
    } );

    // Only apply if we have valid operations
    if ( validOperations.length > 0 ) {
      const patchResult = applyPatch(
        this.state,
        validOperations,
        true,  // validate operation
        false  // mutate document
      );

      // Update the bot's state with the patched state
      this.state = patchResult.newDocument;
      this.services.hangoutState = patchResult.newDocument;

      this.services.logger.debug( `State updated via patch for message: ${ message.name }` );
      this.services.logger.debug( `Applied ${ validOperations.length } patch operations` );

      if ( validOperations.length < statePatch.length ) {
        this.services.logger.debug( `Skipped ${ statePatch.length - validOperations.length } invalid operations` );
      }
    } else {
      this.services.logger.debug( `No valid operations to apply for message: ${ message.name }` );
    }
  }

  // ========================================================
  // Connection Helper Functions
  // ========================================================

  async _initializeStateServiceSafely () {
    // Validate that state is properly set up before initializing StateService
    if ( !this.services.hangoutState ) {
      throw new Error( 'hangoutState is not set - state initialization failed' );
    }

    // Additional validation to ensure state contains expected structure
    const stateKeys = Object.keys( this.services.hangoutState );
    this.services.logger.debug( `State keys available: ${ stateKeys.join( ', ' ) }` );

    if ( stateKeys.length === 0 ) {
      throw new Error( 'hangoutState is empty - no state data received from socket' );
    }

    // Log state structure for debugging
    this.services.logger.debug( `State structure: allUserData=${ !!this.services.hangoutState.allUserData }, allUsers=${ !!this.services.hangoutState.allUsers }` );

    // Now initialize the state service
    this.services.initializeStateService();
    this.services.logger.debug( 'StateService initialized successfully with validated state' );
  }

  async _initializeMessageTracking () {
    // Initialize lastMessageIDs from service container state
    const lastMessageId = this.services.getState( 'lastMessageId' );

    if ( lastMessageId ) {
      this.lastMessageIDs.id = lastMessageId;
      // We don't have fromTimestamp in persistent state, so start fresh
      this.lastMessageIDs.fromTimestamp = Date.now();
      this.services.logger.debug( `Initialized message tracking with ID: ${ lastMessageId }` );
    } else {
      this.services.logger.debug( 'No previous message ID found, will fetch from latest messages' );

      // Try to get the latest message ID to establish a baseline using the correct API function
      try {
        const latestMessageId = await this.services.messageService.returnLatestGroupMessageId();
        if ( latestMessageId ) {
          this.lastMessageIDs.id = latestMessageId;
          this.lastMessageIDs.fromTimestamp = Date.now();
          this.services.updateLastMessageId( latestMessageId );
          this.services.logger.debug( `Initialized tracking with latest message ID: ${ latestMessageId }` );
        } else {
          this.services.logger.debug( 'No messages found to establish baseline, starting fresh' );
          this.lastMessageIDs.fromTimestamp = Date.now();
        }
      } catch ( error ) {
        this.services.logger.warn( `Could not fetch latest message ID: ${ error.message }` );
        this.lastMessageIDs.fromTimestamp = Date.now();
      }
    }
  }

  async _joinCometChat () {
    this.services.logger.debug( 'Joining the chat...' );
    await this.services.messageService.joinChat( this.services.config.HANGOUT_ID );
  }

  async _createSocketConnection () {
    this.services.logger.debug( 'Creating SocketClient...' );
    this.socket = new SocketClient( 'https://socket.prod.tt.fm' );
    this.services.logger.debug( '✅ SocketClient created' );
    this.services.socket = this.socket; // Register socket to serviceContainer
    this.services.logger.debug( 'Socket registered to serviceContainer' );
  }

  async _joinSocketRoom () {
    this.services.logger.debug( 'Joining room...' );

    try {
      // Set a flag to indicate we're in the middle of initial connection
      this._isInitialConnection = true;

      const connection = await this._joinRoomWithTimeout();
      this.services.logger.debug( '✅ Room joined successfully, setting up state...' );

      // CRITICAL: Set state immediately to prevent race conditions
      this.state = connection.state;
      this.services.hangoutState = connection.state;

      // Apply any deferred patches that arrived during room join
      await this._applyDeferredPatches();

      // Clear the initial connection flag
      this._isInitialConnection = false;

      // Add a delay to ensure the state is fully propagated and any immediate
      // stateful messages during connection are processed
      this.services.logger.debug( 'Allowing state propagation and initial message processing...' );
      await new Promise( resolve => setTimeout( resolve, 500 ) );

      // Initialize the state service with validation
      try {
        await this._initializeStateServiceSafely();
      } catch ( stateError ) {
        this.services.logger.error( `❌ Failed to initialize state service: ${ stateError.message }` );
        throw stateError;
      }

      // Log initial state if DEBUG logging is enabled
      if ( this.services.config.SOCKET_MESSAGE_LOG_LEVEL === 'DEBUG' ) {
        try {
          const logsDir = path.join( process.cwd(), 'logs' );
          const initialStateFile = path.join( logsDir, '000000_initialState.log' );
          const timestamp = new Date().toISOString();
          const logEntry = `${ timestamp }: ${ JSON.stringify( this.services.hangoutState, null, 2 ) }\n`;

          await fs.appendFile( initialStateFile, logEntry );
          this.services.logger.debug( 'Initial state logged to 000000_initialState.log' );
        } catch ( logError ) {
          this.services.logger.error( `Failed to log initial state: ${ logError.message }` );
        }
      }
    } catch ( joinError ) {
      // Clear the initial connection flag on error
      this._isInitialConnection = false;
      this.services.logger.error( `❌ Failed to join room: ${ joinError }` );
      throw joinError;
    }
  }

  async _joinRoomWithTimeout () {
    const timeoutMs = 10000;

    return Promise.race( [
      this.socket.joinRoom( this.services.config.BOT_USER_TOKEN, {
        roomUuid: this.services.config.HANGOUT_ID
      } ),
      new Promise( ( _, reject ) =>
        setTimeout( () => reject( new Error( `Socket join room timeout after ${ timeoutMs / 1000 } seconds` ) ), timeoutMs )
      )
    ] );
  }

  _setupReconnectHandler () {
    this.services.logger.debug( '✅ Setting up reconnect handler...' );

    this.socket.on( "reconnect", async () => {
      this.services.logger.debug( '🔄 Reconnecting to room...' );
      try {
        const { state } = await this.socket.joinRoom( this.services.config.BOT_USER_TOKEN, {
          roomUuid: this.services.config.HANGOUT_ID
        } );
        this.state = state;
        this.services.hangoutState = state;
        this.services.logger.debug( '🔄 Reconnected successfully' );
      } catch ( error ) {
        this.services.logger.error( `❌ Reconnection failed: ${ error }` );
      }
    } );
  }

  // ========================================================
  // Listener Configuration
  // ========================================================

  configureListeners () {
    // This method is kept for backwards compatibility
    // In the new flow, listeners are set up individually after state is available
    this._setupStatefulMessageListener();
    this._setupStatelessMessageListener();
    this._setupServerMessageListener();
    this._setupErrorListener();
  }

  _setupStatefulMessageListener () {
    this.socket.on( 'statefulMessage', async ( message ) => {
      this.services.logger.debug( `statefulMessage - ${ message.name }` );

      // Log payload to file
      await this._writeSocketMessagesToLogFile( 'statefulMessage.log', message );

      // Apply state patch to update current state
      if ( message.statePatch ) {
        // During initial connection, we might not have state yet
        if ( this.state && !this._isInitialConnection ) {
          // State is available and we're not in initial connection - apply immediately
          try {
            await this._applyStatePatch( message, message.statePatch );
          } catch ( error ) {
            // Format the error message to include important details but exclude the tree
            let errorMsg = error.message;
            const messageParts = error.message.split( '\ntree:' );
            errorMsg = messageParts[ 0 ];  // Take everything before 'tree:'
            this.services.logger.error( `Failed to apply state patch for ${ message.name }: ${ errorMsg }` );
            // Continue execution even if patch fails to avoid breaking the bot
          }
        } else if ( this._isInitialConnection ) {
          // State not available yet during initial connection - defer the patch
          this.services.logger.debug( `Deferring state patch for ${ message.name } until state is available` );
          this.deferredPatches.push( { message, statePatch: message.statePatch } );
        } else {
          // Not in initial connection but no state available - this is unusual, warn about it
          this.services.logger.warn( `Received state patch but no current state available for message: ${ message.name }` );
        }
      } else {
        this.services.logger.debug( `No state patch provided for message: ${ message.name }` );
      }

      // Handler logic based on message.name
      try {
        const handlers = require( '../handlers' );
        const handlerFn = handlers[ message.name ];
        if ( typeof handlerFn === 'function' ) {
          this.services.logger.debug( `Calling handler for statefulMessage: ${ message.name }` );
          await handlerFn( message, this.state, this.services );
        } else {
          this.services.logger.debug( `No handler found for statefulMessage: ${ message.name }` );
        }
      } catch ( err ) {
        this.services.logger.error( `Error calling handler for statefulMessage ${ message.name }: ${ err.message }` );
      }
    } );
  }

  _setupStatelessMessageListener () {
    this.socket.on( "statelessMessage", async ( payload ) => {
      this.services.logger.debug( `statelessMessage - ${ payload.name }` );

      // Log payload to file
      await this._writeSocketMessagesToLogFile( 'statelessMessage.log', payload );

      // TODO: Add specific handler logic based on payload.name
    } );
  }

  _setupServerMessageListener () {
    this.socket.on( "serverMessage", async ( payload ) => {
      this.services.logger.debug( `serverMessage - ${ payload.message.name }` );

      // Log payload to file
      await this._writeSocketMessagesToLogFile( 'serverMessage.log', payload );

      // TODO: Add specific handler logic based on payload.message.name
    } );
  }

  _setupErrorListener () {
    this.socket.on( "error", async ( message ) => {
      this.services.logger.debug( `Socket error: ${ message }` );

      // Log message to file
      await this._writeSocketMessagesToLogFile( 'socketError.log', { error: message, timestamp: new Date().toISOString() } );

      // TODO: Add specific error handling logic
    } );
  }

  // ========================================================
  // Message Processing
  // ========================================================

  async processNewPublicMessages () {
    try {
      const messages = await this._fetchNewMessages();

      if ( !messages?.length ) {
        return; // No new messages to process
      }

      await this._processMessageBatch( messages );
    } catch ( error ) {
      // More defensive error handling
      const errorMessage = error && typeof error === 'object'
        ? ( error.message || error.toString() || 'Unknown error object' )
        : ( error || 'Unknown error' );

      this.services.logger.error( `Error in processNewPublicMessages: ${ errorMessage }` );

      if ( error && error.stack ) {
        this.services.logger.error( `Error stack: ${ error.stack }` );
      }
    }
  }

  async _fetchNewMessages () {
    // Get the most current lastMessageId from service container state
    const serviceLastMessageId = this.services.getState( 'lastMessageId' );
    const localLastMessageId = this.lastMessageIDs?.id;

    // Use service state if available, fallback to local state
    const effectiveLastMessageId = serviceLastMessageId || localLastMessageId;

    // Debug logging to track synchronization
    // this.services.logger.debug( `[Bot] _fetchNewMessages:` );
    // this.services.logger.debug( `[Bot] - Service container lastMessageId: ${ serviceLastMessageId }` );
    // this.services.logger.debug( `[Bot] - Local lastMessageIDs.id: ${ localLastMessageId }` );
    // this.services.logger.debug( `[Bot] - Effective lastMessageId: ${ effectiveLastMessageId }` );
    // this.services.logger.debug( `[Bot] - fromTimestamp: ${ this.lastMessageIDs?.fromTimestamp }` );

    const messages = await this.services.messageService.fetchGroupMessages( this.services.config.HANGOUT_ID, {
      fromTimestamp: this.lastMessageIDs?.fromTimestamp,
      lastID: effectiveLastMessageId,
      filterCommands: true, // Get command messages for processing
      services: this.services // Pass services for state management
    } );

    // Debug: Log what fetchGroupMessages returns
    // this.services.logger.debug( `fetchGroupMessages returned ${ messages?.length || 0 } messages:` );
    // if ( messages && messages.length > 0 ) {
    //   messages.forEach( ( msg, index ) => {
    //     try {
    //       this.services.logger.debug( `Message ${ index } id: ${ msg?.id }` );
    //       this.services.logger.debug( `Message ${ index } sender: ${ JSON.stringify( msg?.sender ) }` );
    //       this.services.logger.debug( `Message ${ index } keys: ${ Object.keys( msg || {} ).join( ', ' ) }` );
    //     } catch ( err ) {
    //       this.services.logger.debug( `Could not log message ${ index }: ${ err.message }` );
    //     }
    //   } );
    // }

    return messages;
  }

  async _processMessageBatch ( messages ) {
    for ( const message of messages ) {
      await this._processSingleMessage( message );
    }
  }

  async _processSingleMessage ( message ) {
    this._updateMessageTracking( message );

    // Debug: Log the message structure safely
    try {
      this.services.logger.debug( `Raw message id: ${ message?.id }` );
      this.services.logger.debug( `Raw message keys: ${ Object.keys( message || {} ).join( ', ' ) }` );
      this.services.logger.debug( `Raw message structure: ${ JSON.stringify( message, null, 2 ) }` );
    } catch ( err ) {
      this.services.logger.debug( `Could not stringify message: ${ err.message }` );
      this.services.logger.debug( `Message type: ${ typeof message }, id: ${ message?.id }` );
    }

    const chatMessage = this._extractChatMessage( message );
    if ( !chatMessage ) return;

    // Debug: Log sender extraction step by step
    this.services.logger.debug( `message?.sender: ${ JSON.stringify( message?.sender ) }` );
    this.services.logger.debug( `message?.sender?.uid: ${ JSON.stringify( message?.sender?.uid ) }` );
    this.services.logger.debug( `typeof message?.sender: ${ typeof message?.sender }` );

    // Extract sender UUID - handle both direct string and object with uid property
    const sender = message?.sender?.uid || message?.sender || '';

    this.services.logger.debug( `Final extracted sender: "${ sender }"` );

    if ( this._shouldIgnoreMessage( sender ) ) return;

    this.services.logger.debug( `Processing message: "${ chatMessage }" from ${ sender }` );

    await this._handleMessage( chatMessage, sender, message );
  }

  _updateMessageTracking ( message ) {
    const previousId = this.lastMessageIDs.id;
    const previousTimestamp = this.lastMessageIDs.fromTimestamp;

    this.services.updateLastMessageId( message.id );
    this.lastMessageIDs.fromTimestamp = message.sentAt + 1;
    this.lastMessageIDs.id = message.id;

    // Debug: Log tracking updates
    this.services.logger.debug( `[Bot] Message tracking updated:` );
    this.services.logger.debug( `[Bot] - Previous ID: ${ previousId } -> New ID: ${ message.id }` );
    this.services.logger.debug( `[Bot] - Previous timestamp: ${ previousTimestamp } -> New timestamp: ${ message.sentAt + 1 }` );
    this.services.logger.debug( `[Bot] - Message sentAt: ${ message.sentAt }` );
  }

  _extractChatMessage ( message ) {
    const messageText = message?.data?.metadata?.chatMessage?.message ?? ''
    this.services.logger.debug( `Chat: ${ messageText }` );
    return messageText
  }

  _shouldIgnoreMessage ( sender ) {
    const ignoredSenders = [
      this.services.config.BOT_UID,
      // this.services.config.CHAT_REPLY_ID // Not defined in .env file
    ].filter( Boolean ); // Remove any undefined values

    return ignoredSenders.includes( sender );
  }

  async _handleMessage ( chatMessage, sender, fullMessage ) {
    this.services.logger.debug( `Chat: ${ chatMessage }` );
    try {
      // Check if parseCommands exists and is a function
      if ( typeof this.services.parseCommands === 'function' ) {
        const parseResult = await this.services.parseCommands( chatMessage, this.services );
        this.services.logger.debug( `parseCommands result: ${ JSON.stringify( parseResult ) }` );

        // If it's a command, process it with commandService
        if ( parseResult && parseResult.isCommand ) {
          this.services.logger.debug( `Command detected: "${ parseResult.command }" with remainder: "${ parseResult.remainder }"` );

          // Check if commandService exists and is a function
          if ( typeof this.services.commandService === 'function' ) {
            const context = {
              sender,
              fullMessage,
              chatMessage
            };

            const commandResult = await this.services.commandService(
              parseResult.command,
              parseResult.remainder,
              this.services,
              context
            );

            this.services.logger.debug( `Command processed: ${ JSON.stringify( commandResult ) }` );
          } else {
            this.services.logger.warn( `commandService is not available: ${ typeof this.services.commandService }` );
          }
        }
      } else {
        this.services.logger.warn( `parseCommands is not a function: ${ typeof this.services.parseCommands }` );
      }

      // TODO: Add additional message handling logic here
      // - Non-command message processing
      // - Context management
    } catch ( error ) {
      // More defensive error handling
      const errorMessage = error && typeof error === 'object'
        ? ( error.message || error.toString() || 'Unknown error object' )
        : ( error || 'Unknown error' );

      this.services.logger.error( `Error in _handleMessage: ${ errorMessage }` );

      if ( error && error.stack ) {
        this.services.logger.error( `Error stack: ${ error.stack }` );
      }

      throw error; // Re-throw so processNewPublicMessages can catch it
    }
  }

  // ========================================================
  // Utility Methods
  // ========================================================

  getConnectionStatus () {
    return {
      isConnected: !!this.socket,
      hasState: !!this.state,
      lastMessageId: this.lastMessageIDs?.id,
      lastTimestamp: this.lastMessageIDs?.fromTimestamp
    };
  }

  async disconnect () {
    this.services.logger.debug( 'Disconnecting bot...' );

    if ( this.socket ) {
      // TODO: Add proper socket cleanup
      this.socket = null;
    }

    this.state = null;
    this.services.hangoutState = null;
    this.services.logger.debug( '✅ Bot disconnected' );
  }
}

module.exports = { Bot };
