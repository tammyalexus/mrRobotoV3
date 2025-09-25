// Services Container - Singleton pattern via Node.js module caching
const { messageService } = require( './messageService.js' );
const parseCommands = require( './parseCommands.js' );
const commandService = require( './commandService.js' );
const playlistService = require( './playlistService.js' );
const { hangSocketServices } = require( './hangSocketServices.js' );
const { logger } = require( '../lib/logging.js' );
const config = require( '../config.js' );
const hangUserService = require( './hangUserService.js' );
const StateService = require( './stateService.js' );
const DataService = require( './dataService.js' );

// Shared state that all services can access and modify
const sharedState = {
  lastMessageId: null,
  connectedUsers: [],
  botStatus: 'disconnected',
  messageCache: new Map(),
  userSessions: new Map(),
  currentPlaylist: [],
  dbConnectionStatus: 'disconnected'
};

// Services container with shared references
// Initialize dataService
const dataService = require( './dataService.js' );

// Load data and make it available in the services container
const initializeData = async () => {
  try {
    await dataService.loadData();
    services.data = dataService.getAllData();
  } catch ( err ) {
    logger.error( 'Failed to load data:', err );
    services.data = {}; // Fallback to empty object
  }
};

const services = {
  // External services
  messageService,
  parseCommands,
  commandService,
  playlistService,
  hangSocketServices,
  hangUserService,
  logger,
  config,
  dataService,
  data: {}, // Will be populated by initializeData()

  // Shared state
  state: sharedState,
  hangoutState: {}, // Initialize hangoutState

  // Helper methods for state management
  setState ( key, value ) {
    if ( !this.hangoutState ) this.hangoutState = {};
    this.hangoutState[ key ] = value;
    if ( this.state ) this.state[ key ] = value;
    this.logger.debug( `State updated: ${ key } = ${ value }` );
  },

  getState ( key ) {
    if ( !this.hangoutState ) this.hangoutState = {};
    // Prefer hangoutState, fallback to state
    return this.hangoutState[ key ] !== undefined ? this.hangoutState[ key ] : this.state[ key ];
  },

  updateLastMessageId ( id ) {
    if ( !this.hangoutState ) this.hangoutState = {};
    this.hangoutState.lastMessageId = id;
    if ( this.state ) this.state.lastMessageId = id;
    this.logger.debug( `Last message ID updated to: ${ id }` );
  },

  initializeStateService () {
    if ( !this.hangoutState ) {
      throw new Error( 'Cannot initialize StateService: hangoutState is not set' );
    }
    this.stateService = new StateService( this.hangoutState, this );
    this.logger.debug( 'StateService initialized' );
  }
};

// Initialize data asynchronously
initializeData();

module.exports = services;
