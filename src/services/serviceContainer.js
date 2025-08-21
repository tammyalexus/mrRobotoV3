// Services Container - Singleton pattern via Node.js module caching
const { messageService } = require('./messageService.js');
const parseCommands = require('./parseCommands.js');
const commandService = require('./commandService.js');
const playlistService = require('./playlistService.js');
const { hangSocketServices } = require('./hangSocketServices.js');
const { logger } = require('../lib/logging.js');
const config = require('../config.js');
const hangUserService = require('./hangUserService.js');

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
  
  // Shared state
  state: sharedState,
  hangoutState: {}, // Initialize hangoutState

  // Helper methods for state management
  setState(key, value) {
    if (!this.hangoutState) this.hangoutState = {};
    this.hangoutState[key] = value;
    if (this.state) this.state[key] = value;
    this.logger.debug(`State updated: ${key} = ${value}`);
  },

  getState(key) {
    if (!this.hangoutState) this.hangoutState = {};
    // Prefer hangoutState, fallback to state
    return this.hangoutState[key] !== undefined ? this.hangoutState[key] : this.state[key];
  },

  updateLastMessageId(id) {
    if (!this.hangoutState) this.hangoutState = {};
    this.hangoutState.lastMessageId = id;
    if (this.state) this.state.lastMessageId = id;
    this.logger.debug(`Last message ID updated to: ${id}`);
  }
};

module.exports = services;
