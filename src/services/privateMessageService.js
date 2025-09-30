// src/services/privateMessageService.js
const { v4: uuidv4 } = require( 'uuid' );
const cometchatApi = require( './cometchatApi.js' );
const config = require( '../config.js' );
const { logger } = require( '../lib/logging.js' );
const { buildUrl, makeRequest } = require( '../lib/buildUrl' );

// Constants
const RECEIVER_TYPE = {
    USER: "user"
};

// ===============
// Helper functions
// ===============

// buildCustomData and buildPayload are now imported from cometchatApi

// ===============
// Private Message Service
// ===============

const privateMessageService = {
    // Helper functions (exported for testing) - now from cometchatApi
    buildCustomData: cometchatApi.buildCustomData,
    buildPayload: cometchatApi.buildPayload,

    /**
     * Send a private message to a user
     * @param {string} theMessage - The message text
     * @param {string} receiver - The receiver's user ID
     * @param {Object} services - Required services container
     * @returns {Promise<void>}
     */
    sendPrivateMessage: async function ( theMessage, receiver, services ) {
        try {
            const customData = await cometchatApi.buildCustomData( theMessage, services );
            const payload = await cometchatApi.buildPayload( receiver, RECEIVER_TYPE.USER, customData, theMessage );
            const response = await cometchatApi.sendMessage( payload );
            logger.debug( `✅ Private message sent: ${ JSON.stringify( response.data, null, 2 ) }` );
        } catch ( err ) {
            logger.error( `❌ Failed to send private message: ${ err.response?.data || err.message }` );
        }
    },

    /**
     * Get the last message from a specific user
     * @param {string} userID - The user ID
     * @returns {Promise<string|null>} Message ID or null
     */
    returnLastUserMessage: async function ( userID ) {
        logger.debug( `🔍 [returnLastUserMessage] Starting fetch for user: ${userID}` );
        
        try {
            // Use the correct CometChat REST API endpoint for fetching messages
            const endpoint = `v3/messages?receiverType=user&sender=${userID}&limit=1`;
            logger.debug( `🔍 [returnLastUserMessage] Calling endpoint: ${endpoint}` );

            const response = await cometchatApi.fetchMessages( endpoint );
            
            logger.debug( `🔍 [returnLastUserMessage] Response received - status: ${response?.status}` );
            logger.debug( `🔍 [returnLastUserMessage] - Response.data.data length: ${Array.isArray(response?.data?.data) ? response.data.data.length : 'not an array'}` );

            if ( !response?.data?.data || !Array.isArray( response.data.data ) ) {
                logger.debug( `🔍 [returnLastUserMessage] Malformed response data, returning null` );
                return null;
            }

            if ( response.data.data.length > 0 ) {
                const lastMessage = response.data.data[ 0 ];
                logger.debug( `🔍 [returnLastUserMessage] Found last message: ${JSON.stringify(lastMessage, null, 2)}` );
                logger.debug( `🔍 [returnLastUserMessage] Returning message ID: ${lastMessage.id}` );
                return lastMessage.id;
            }

            logger.debug( `🔍 [returnLastUserMessage] No messages found, returning null` );
            return null;
        } catch ( err ) {
            logger.error( `❌ [returnLastUserMessage] Error getting last user message: ${ err.message }` );
            logger.error( `❌ [returnLastUserMessage] Error stack: ${ err.stack }` );
            return null;
        }
    },

    /**
     * Mark all private messages from a user as read
     * @param {string} userID - The user ID
     * @returns {Promise<void>}
     */
    markAllPrivateUserMessagesAsRead: async function ( userID ) {
        try {
            const lastMessageId = await this.returnLastUserMessage( userID );

            if ( lastMessageId ) {
                await this.markMessageAsInterracted( lastMessageId );
                logger.debug( `✅ Marked messages as read for user: ${ userID }` );
            } else {
                logger.debug( `No unread messages found for user ${ userID }` );
            }
        } catch ( err ) {
            logger.error( `❌ Error marking all private user messages as read for user ${ userID }: ${ err.message }` );
        }
    },

    /**
     * Mark a specific message as interacted/read, or mark entire conversation as read
     * @param {string} [lastMessageID] - The message ID to mark as read (optional)
     * @returns {Promise<void>}
     */
    markMessageAsInterracted: async function ( lastMessageID ) {
        try {
            if ( lastMessageID ) {
                // Mark specific message as read
                const conversationUrl = `${ cometchatApi.BASE_URL }/v3/messages/${ lastMessageID }/interactions`;
                await cometchatApi.markConversationAsRead( conversationUrl );
                logger.debug( `✅ Message marked as read: ${ lastMessageID }` );
            } else {
                // Mark entire conversation as read
                const conversationUrl = `${ cometchatApi.BASE_URL }/v3/users/${ config.COMETCHAT_RECEIVER_UID }/conversation/read`;
                await cometchatApi.markConversationAsRead( conversationUrl );
                logger.debug( `✅ Conversation marked as read for user: ${ config.COMETCHAT_RECEIVER_UID }` );
            }
        } catch ( err ) {
            logger.error( `❌ Error marking message as read: ${ err.response?.data || err.message }` );
            throw err;
        }
    },

    /**
     * Fetch all private messages from a specific user with optional logging
     * @param {string} userUUID - The user UUID
     * @param {Object} [options] - Optional configuration
     * @param {boolean} [options.logLastMessage=false] - Whether to log the last message details
     * @param {boolean} [options.returnData=true] - Whether to return the message data array
     * @returns {Promise<Array>} Array of simplified messages (empty if returnData=false)
     */
    fetchAllPrivateUserMessages: async function ( userUUID, options = {} ) {
        const { logLastMessage = false, returnData = true } = options;
        
        logger.debug( `🔍 [fetchAllPrivateUserMessages] Starting fetch for user: ${userUUID}` );
        logger.debug( `🔍 [fetchAllPrivateUserMessages] Options: ${JSON.stringify(options)}` );
        
        try {
            // Use the correct CometChat REST API endpoint for fetching messages
            // This fetches messages where the sender is the specified user and receiver type is 'user'
            const endpoint = `v3/messages?receiverType=user&sender=${userUUID}&limit=100`;
            logger.debug( `🔍 [fetchAllPrivateUserMessages] Calling endpoint: ${endpoint}` );
            
            const response = await cometchatApi.fetchMessages( endpoint );
            
            logger.debug( `🔍 [fetchAllPrivateUserMessages] Response received - status: ${response?.status}` );
            logger.debug( `🔍 [fetchAllPrivateUserMessages] - Response.data type: ${typeof response?.data}` );
            logger.debug( `🔍 [fetchAllPrivateUserMessages] - Response.data.data length: ${Array.isArray(response?.data?.data) ? response.data.data.length : 'not an array'}` );

            if ( !response?.data || !Array.isArray( response.data.data ) ) {
                logger.debug( `🔍 [fetchAllPrivateUserMessages] No valid data array found in response` );
                if ( logLastMessage ) {
                    logger.debug( '📥 No private messages found.' );
                }
                return [];
            }

            const messages = response.data.data;
            logger.debug( `🔍 [fetchAllPrivateUserMessages] Found ${messages.length} messages` );
            
            // Log the last message if requested
            if ( logLastMessage ) {
                if ( messages.length > 0 ) {
                    const lastMessage = messages[0]; // Messages are typically in reverse chronological order
                    const text = lastMessage.data?.text || '[No Text]';
                    const sender = lastMessage.sender?.uid || lastMessage.sender || 'Unknown';
                    logger.debug( `📥 Private message from ${ sender }: ${ text }` );
                } else {
                    logger.debug( '📥 No private messages found.' );
                }
            }

            // Return data if requested
            if ( !returnData ) {
                logger.debug( `🔍 [fetchAllPrivateUserMessages] returnData=false, returning empty array` );
                return [];
            }

            const simplifiedMessages = messages.map( (msg, index) => {
                logger.debug( `🔍 [fetchAllPrivateUserMessages] Processing message ${index}: ${JSON.stringify(msg, null, 2)}` );
                
                const customData = msg.data?.metadata?.chatMessage;

                // Extract sender UUID from nested structure (same as groupMessageService)
                const senderFromData = msg.data?.entities?.sender?.entity?.uid;
                const senderFromChatMessage = msg.data?.metadata?.chatMessage?.userUuid;
                const senderFromCustomData = msg.data?.metadata?.message?.customData?.userUuid;
                const extractedSender = msg.sender?.uid || senderFromData || senderFromChatMessage || senderFromCustomData || 'Unknown';

                const simplified = {
                    id: msg.id,
                    text: msg.data?.text || '[No content]',
                    sender: extractedSender,
                    sentAt: msg.sentAt,
                    customData: customData || null
                };
                
                logger.debug( `🔍 [fetchAllPrivateUserMessages] Simplified message ${index}: ${JSON.stringify(simplified, null, 2)}` );
                return simplified;
            } );

            logger.debug( `🔍 [fetchAllPrivateUserMessages] Returning ${simplifiedMessages.length} simplified messages` );
            return simplifiedMessages;
        } catch ( err ) {
            logger.error( `❌ [fetchAllPrivateUserMessages] Error fetching private messages: ${ err.message }` );
            logger.error( `❌ [fetchAllPrivateUserMessages] Error stack: ${ err.stack }` );
            return [];
        }
    }
};

module.exports = privateMessageService;
