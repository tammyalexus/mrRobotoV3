// src/services/messageService.js
// Unified message service that combines group and private messaging functionality

const groupMessageService = require( './groupMessageService.js' );
const privateMessageService = require( './privateMessageService.js' );
const cometchatApi = require( './cometchatApi.js' );
const { buildUrl } = require( '../lib/buildUrl.js' );
const { logger } = require( '../lib/logging.js' );

// ===============
// Unified Message Service
// ===============

const messageService = {
  // ===============
  // Group Message Functions
  // ===============

  // Direct exports from groupMessageService
  joinChat: groupMessageService.joinChat,
  sendGroupMessage: groupMessageService.sendGroupMessage,
  sendGroupPictureMessage: groupMessageService.sendGroupPictureMessage,
  fetchGroupMessages: groupMessageService.fetchGroupMessages,
  fetchGroupMessagesRaw: groupMessageService.fetchGroupMessagesRaw,
  getLatestGroupMessageId: groupMessageService.getLatestGroupMessageId,
  setLatestGroupMessageId: groupMessageService.setLatestGroupMessageId,

  // ===============
  // Private Message Functions
  // ===============

  // Direct exports from privateMessageService
  sendPrivateMessage: privateMessageService.sendPrivateMessage,
  returnLastUserMessage: privateMessageService.returnLastUserMessage,
  markAllPrivateUserMessagesAsRead: privateMessageService.markAllPrivateUserMessagesAsRead,
  markMessageAsInterracted: privateMessageService.markMessageAsInterracted,
  fetchAllPrivateUserMessages: privateMessageService.fetchAllPrivateUserMessages,
  fetchPrivateMessagesForUUID: privateMessageService.fetchPrivateMessagesForUUID,

  // ===============
  // Helper Functions (for backward compatibility)
  // ===============

  buildCustomData: groupMessageService.buildCustomData,
  buildPayload: groupMessageService.buildPayload,
  filterMessagesForCommands: groupMessageService.filterMessagesForCommands,

  // ===============
  // Additional Message Functions (if needed)
  // ===============

  /**
   * Get the latest group message ID with lookback functionality
   * @returns {Promise<string|null>} Latest message ID
   */
  returnLatestGroupMessageId: async function () {
    const MAX_LOOKBACK_MINUTES = 10;
    const now = Math.floor( Date.now() / 1000 );
    const config = require( '../config.js' );

    for ( let i = 0; i <= MAX_LOOKBACK_MINUTES; i++ ) {
      const lookbackTimestamp = now - i * 60;

      const url = buildUrl( cometchatApi.BASE_URL, [
        'v3.0', 'groups', config.HANGOUT_ID, 'messages'
      ], [
        [ 'per_page', 1 ],
        [ 'hideMessagesFromBlockedUsers', 0 ],
        [ 'unread', 0 ],
        [ 'undelivered', 0 ],
        [ 'withTags', 0 ],
        [ 'hideDeleted', 0 ],
        [ 'affix', 'append' ],
        [ 'updatedAt', lookbackTimestamp ]
      ] );

      // logger.debug( `[messageService] returnLatestGroupMessageId - url: ${ url }` );
      try {
        const res = await cometchatApi.apiClient.get( url );
        const messages = res.data?.data;

        if ( Array.isArray( messages ) && messages.length > 0 ) {
          const latest = messages[ 0 ];
          // logger.debug( `✅ Found message: ID ${ latest.id } at sentAt ${ latest.sentAt } (lookback ${ i }m)` );
          return latest.id;
        }
        // logger.debug( `🔍 No messages at ${ lookbackTimestamp } (${ i } min ago)` );
      } catch ( err ) {
        logger.error( `❌ Error fetching messages at lookback ${ i }m: ${ err.message }` );
        return null;
      }
    }

    logger.warn( '⚠️ No messages found in lookback window' );
    return null;
  }
}

module.exports = { messageService };
