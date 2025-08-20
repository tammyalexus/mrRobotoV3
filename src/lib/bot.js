const { ServerMessageName, SocketClient, StatefulServerMessageName, StatelessServerMessageName } = require( 'ttfm-socket' );
const { applyPatch } = require( 'fast-json-patch' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );

class Bot {
  constructor ( slug, services ) {
    this.services = services;
    this.lastMessageIDs = {}
    this.socketLogCounter = 0; // Counter for debug mode logging
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
      const today = new Date().toISOString().slice( 0, 10 );

      if ( filename === 'general.log' ) {
        // General log always uses the date
        filePath = path.join( logsDir, `${ today }.log` );
      } else {
        // Socket logs
        if ( logLevel === 'ON' ) {
          // Each socket type logs to its own file (e.g., statefulMessage.log)
          filePath = path.join( logsDir, filename );
        } else if ( logLevel === 'DEBUG' ) {
          // Each socket message gets its own numbered file
          this.socketLogCounter++;
          let debugFilename;
          if ( data && typeof data === 'object' ) {
            let type = filename.replace( '.log', '' );
            let name = data.name || ( data.message && data.message.name );
            const paddedCounter = String( this.socketLogCounter ).padStart( 6, '0' );
            if ( name ) {
              debugFilename = `${ paddedCounter }_${ type }_${ name }.log`;
            } else {
              debugFilename = `${ paddedCounter }_${ type }.log`;
            }
          } else {
            const baseFilename = filename.replace( '.log', '' );
            const paddedCounter = String( this.socketLogCounter ).padStart( 6, '0' );
            debugFilename = `${ paddedCounter }_${ baseFilename }.log`;
          }
          filePath = path.join( logsDir, debugFilename );
        } else {
          // Should not happen, but fallback to date log
          filePath = path.join( logsDir, `${ today }.log` );
        }
      }

      const timestamp = new Date().toISOString();
      const logEntry = `${ timestamp }: ${ JSON.stringify( data, null, 2 ) }\n`;

      await fs.appendFile( filePath, logEntry );
      try {
        const logsDir = path.join( process.cwd(), 'logs' );
        let filePath;
        let today;
        try {
          today = new Date().toISOString().slice( 0, 10 );
        } catch ( dateError ) {
          today = 'unknown-date';
        }

        if ( filename === 'general.log' ) {
          // General log always uses the date
          filePath = path.join( logsDir, `${ today }.log` );
        } else {
          // Socket logs
          if ( logLevel === 'ON' ) {
          async _writeSocketMessagesToLogFile( filename, data ) {
              const logLevel = this.services.config.SOCKET_MESSAGE_LOG_LEVEL;

              // If logging is OFF, don't log anything
              if ( logLevel === 'OFF' ) {
                return;
              }

              try {
                const logsDir = path.join( process.cwd(), 'logs' );
                let filePath;
                const today = new Date().toISOString().slice( 0, 10 );

                if ( filename === 'general.log' ) {
                  // General log always uses the date
                  filePath = path.join( logsDir, `${ today }.log` );
                } else {
                  // Socket logs
                  if ( logLevel === 'ON' ) {
                    // Each socket type logs to its own file (e.g., statefulMessage.log)
                    filePath = path.join( logsDir, filename );
                  } else if ( logLevel === 'DEBUG' ) {
                    // Each socket message gets its own numbered file
                    this.socketLogCounter++;
                    let debugFilename;
                    if ( data && typeof data === 'object' ) {
                      let type = filename.replace( '.log', '' );
                      let name = data.name || ( data.message && data.message.name );
                      const paddedCounter = String( this.socketLogCounter ).padStart( 6, '0' );
                      if ( name ) {
                        debugFilename = `${ paddedCounter }_${ type }_${ name }.log`;
                      } else {
                        debugFilename = `${ paddedCounter }_${ type }.log`;
                      }
                    } else {
                      const baseFilename = filename.replace( '.log', '' );
                      const paddedCounter = String( this.socketLogCounter ).padStart( 6, '0' );
                      debugFilename = `${ paddedCounter }_${ baseFilename }.log`;
                    }
                    filePath = path.join( logsDir, debugFilename );
                  } else {
                    // Should not happen, but fallback to date log
                    filePath = path.join( logsDir, `${ today }.log` );
                  }
                }

                const timestamp = new Date().toISOString();
                const logEntry = `${ timestamp }: ${ JSON.stringify( data, null, 2 ) }\n`;

                await fs.appendFile( filePath, logEntry );
              } catch ( error ) {
                let errorMsg = error && error.message ? error.message : String( error );
                this.services.logger.error( `Failed to write to log file ${ filename }: ${ errorMsg }` );
              }
            }
          } ),
          new Promise( ( _, reject ) =>
            setTimeout( () => reject( new Error( `Socket join room timeout after ${ timeoutMs / 1000 } seconds` ) ), timeoutMs )
          )
  ] );
        }

        _setupReconnectHandler() {
          this.services.logger.debug( '✅ Setting up reconnect handler...' );

          this.socket.on( "reconnect", async () => {
            this.services.logger.debug( '🔄 Reconnecting to room...' );
            try {
              const { state } = await this.socket.joinRoom( this.services.config.BOT_USER_TOKEN, {
                roomUuid: this.services.config.HANGOUT_ID
              } );
              this.state = state; // Fixed: was using 'connection.state' instead of 'state'
              this.services.logger.debug( '🔄 Reconnected successfully' );
            } catch ( error ) {
              this.services.logger.error( `❌ Reconnection failed: ${ error }` );
            }
          } );
        }

        // ========================================================
        // Listener Configuration
        // ========================================================

        configureListeners() {
          this.services.logger.debug( 'Setting up listeners' );

          this._setupStatefulMessageListener();
          this._setupStatelessMessageListener();
          this._setupServerMessageListener();
          this._setupErrorListener();
        }

        _setupStatefulMessageListener() {
          this.socket.on( 'statefulMessage', async ( message ) => {
            this.services.logger.debug( `statefulMessage - ${ message.name }` );
            await this._writeSocketMessagesToLogFile( 'statefulMessage.log', message );
            if ( message.statePatch && this.state ) {
              try {
                const patchResult = applyPatch(
                  this.state,
                  message.statePatch,
                  true,
                  false
                );
                this.state = patchResult.newDocument;
                this.services.logger.debug( `State updated via patch for message: ${ message.name }` );
                this.services.logger.debug( `Applied ${ message.statePatch.length } patch operations` );
              } catch ( error ) {
                this.services.logger.error( `Failed to apply state patch for ${ message.name }: ${ error.message }` );
                // Continue execution even if patch fails
              }
            } else if ( message.statePatch && !this.state ) {
              this.services.logger.warn( `Received state patch but no current state available for message: ${ message.name }` );
            }
            // TODO: Add specific handler logic based on message.name
          } );
        }

        try {
          const logsDir = path.join( process.cwd(), 'logs' );
          let filePath;
          let today;
          try {
            today = new Date().toISOString().slice( 0, 10 );
          } catch ( dateError ) {
            today = 'unknown-date';
          }

          if ( filename === 'general.log' ) {
            // General log always uses the date
            filePath = path.join( logsDir, `${ today }.log` );
          } else {
            // Socket logs
            if ( logLevel === 'ON' ) {
              // Each socket type logs to its own file (e.g., statefulMessage.log)
              filePath = path.join( logsDir, filename );
            } else if ( logLevel === 'DEBUG' ) {
              // Each socket message gets its own numbered file
              this.socketLogCounter++;
              let debugFilename;
              if ( data && typeof data === 'object' ) {
                let type = filename.replace( '.log', '' );
                let name = data.name || ( data.message && data.message.name );
                const paddedCounter = String( this.socketLogCounter ).padStart( 6, '0' );
                if ( name ) {
                  debugFilename = `${ paddedCounter }_${ type }_${ name }.log`;
                } else {
                  debugFilename = `${ paddedCounter }_${ type }.log`;
                }
              } else {
                const baseFilename = filename.replace( '.log', '' );
                const paddedCounter = String( this.socketLogCounter ).padStart( 6, '0' );
                debugFilename = `${ paddedCounter }_${ baseFilename }.log`;
              }
              filePath = path.join( logsDir, debugFilename );
            } else {
              // Should not happen, but fallback to date log
              filePath = path.join( logsDir, `${ today }.log` );
            }
          }

          const timestamp = new Date().toISOString();
          const logEntry = `${ timestamp }: ${ JSON.stringify( data, null, 2 ) }\n`;

          await fs.appendFile( filePath, logEntry );
        } catch ( error ) {
          let errorMsg = error && error.message ? error.message : String( error );
          this.services.logger.error( `Failed to write to log file ${ filename }: ${ errorMsg }` );
        }
      }

  async _handleMessage( chatMessage, sender, fullMessage ) {
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

          throw error; // Re-throw so processNewMessages can catch it
        }
      }

      // ========================================================
      // Utility Methods
      // ========================================================

      getConnectionStatus() {
        return {
          isConnected: !!this.socket,
          hasState: !!this.state,
          lastMessageId: this.lastMessageIDs?.id,
          lastTimestamp: this.lastMessageIDs?.fromTimestamp
        };
      }

  async disconnect() {
        this.services.logger.debug( 'Disconnecting bot...' );

        if ( this.socket ) {
          // TODO: Add proper socket cleanup
          this.socket = null;
        }

        this.state = null;
        this.services.logger.debug( '✅ Bot disconnected' );
      }
    }

module.exports = { Bot };
