// src/services/messageService.js
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { buildUrl } = require('../lib/buildUrl');
const cometchatApi = require('./cometchatApi.js');
const config = require('../config.js');
const { logger } = require('../lib/logging.js');

// variables
const RECEIVER_TYPE = {
  USER: "user",
  GROUP: "group"
};

let latestGroupMessageId = null;

// ===============

// Helper functions

function setLatestGroupMessageId(id) {
  latestGroupMessageId = id;
}

function getLatestGroupMessageId() {
  return latestGroupMessageId;
}

async function buildCustomData( theMessage ) {
  return {
    message: theMessage,
    avatarId: config.CHAT_AVATAR_ID,
    userName: config.CHAT_NAME,
    color: `#${ config.CHAT_COLOUR }`,
    mentions: [],
    userUuid: config.BOT_UID,
    badges: [ 'VERIFIED', 'STAFF' ],
    id: uuidv4()
  };
}

async function buildPayload( receiver, receiverType, customData, theMessage ) {
  return {
    receiver: receiver,
    receiverType: receiverType,
    category: 'message',
    type: 'text',
    data: {
      text: theMessage,
      metadata: {
        chatMessage: customData
      }
    }
  };
}

// ===============

// exported functions

const messageService = {
  buildCustomData,
  buildPayload,
  getLatestGroupMessageId,
  setLatestGroupMessageId,

  sendPrivateMessage: async function(theMessage, receiver) {
    try {
      const customData = await this.buildCustomData(theMessage);
      const payload = await this.buildPayload(receiver, RECEIVER_TYPE.USER, customData, theMessage);
      const response = await axios.post(`${cometchatApi.BASE_URL}/v3.0/messages`, payload, { headers: cometchatApi.headers });
      logger.debug('✅ Private message sent:', JSON.stringify(response.data, null, 2));
    } catch (err) {
      logger.error('❌ Failed to send private message:', err.response?.data || err.message);
    }
  },

  sendGroupMessage: async function( theMessage ) {
    try {
      const customData = await this.buildCustomData( theMessage );
      const payload = await this.buildPayload( config.HANGOUT_ID, RECEIVER_TYPE.GROUP, customData, theMessage )
      await axios.post( `${ cometchatApi.BASE_URL }/v3.0/messages`, payload, { headers: cometchatApi.headers } );
      // logger.debug( '✅ Group message sent:', JSON.stringify( response.data.data.data.text, null, 2 ) );
    } catch (err) {
      logger.error('❌ Failed to send group message:', err.response?.data || err.message);
    }
  },
  
    markMessageAsInterracted: async function( lastMessageID ) {
    // PATCH /v3/messages/:id/interacted

    try {
      const url = `${cometchatApi.BASE_URL}/v3/messages/${lastMessageID}/interacted`;
      const headers = {
        ...cometchatApi.headers,
        'accept': 'application/json',
        'content-type': 'application/json'
      };
      const data = {
        interactions: [lastMessageID]
      };

      logger.debug(`Attempting to mark message as interacted. ID: ${lastMessageID}, URL: ${url}, Payload: ${JSON.stringify(data)}, Request Headers: ${JSON.stringify(headers)}`);
      const response = await axios.patch(url, data, { headers });
      logger.debug('✅ Marked message as interacted:', JSON.stringify(response.data, null, 2));
      logger.debug('Response status:', response.status);
      logger.debug('Response headers:', JSON.stringify(response.headers));
    } catch (err) {
      logger.error(`❌ Error marking message as interacted for ID ${lastMessageID}:`, err.response?.data || err.message);
      logger.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      if (err.response) {
        logger.error('Full error response:', JSON.stringify(err.response, null, 2));
        logger.error('Response status:', err.response.status);
        logger.error('Response headers:', JSON.stringify(err.response.headers));
      }
    }
  },


  // Returns the last message ID for a user (from fetchAllPrivateUserMessages)
  returnLastUserMessage: async function(userID) {
    try {
      const url = buildUrl( cometchatApi.BASE_URL, [
        'v3', 'users', userID, 'messages'
      ], [
        ['limit', 1],
        ['unread', true],
        ['uid', config.BOT_UID]
      ]);
      const res = await cometchatApi.apiClient.get(url);
      if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data[0].id;
      }
      return null;
    } catch (err) {
      logger.error('❌ Error fetching last user message:', err.message);
      return null;
    }
  },

  // Marks the last private user message as read
  markAllPrivateUserMessagesAsRead: async function (userID) {
    try {
      // logger.debug(`markAllPrivateUserMessagesAsRead called for userID: ${userID}`);
      const lastMsgId = await this.returnLastUserMessage(userID);
      // logger.debug(`Last unread message ID for user ${userID}: ${lastMsgId}`);
      if (lastMsgId) {
        await this.markMessageAsInterracted(lastMsgId);
        // logger.debug(`✅ Marked last private message (${lastMsgId}) as read for user ${userID}`);
      } else {
        logger.debug(`No unread messages found for user ${userID}`);
      }
    } catch (err) {
      logger.error(`❌ Error marking all private user messages as read for user ${userID}:`, err.message);
    }
  },

  fetchAllPrivateUserMessages: async function( userID ) {
    // https://api-explorer.cometchat.com/reference/user-list-user-messages
    try {
      const url = buildUrl( cometchatApi.BASE_URL, [
        'v3',
        'users',
        userID,
        'messages'
      ], [
        [ 'limit', 50 ],
        [ 'unread', true ],
        [ 'uid', config.BOT_UID ]
      ] );

      const res = await cometchatApi.apiClient.get( url );

      // Extract only the fields we need from each message
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        const messages = res.data.data;
        const simplifiedMessages = messages.map(msg => {
          // Extract message content safely (with fallbacks if structure is different)
          const messageContent = msg.data && msg.data.customData && msg.data.customData.message 
            ? msg.data.customData.message 
            : (msg.data && msg.data.text) ? msg.data.text : '[No message content]';

          return {
            id: msg.id,
            message: messageContent,
            readAt: msg.readAt ? new Date(msg.readAt * 1000).toISOString() : 'unread',
            sender: msg.sender // add sender for reply
          };
        });
        return simplifiedMessages;
      } else {
        // logger.debug('No messages found or unexpected response format');
        return [];
      }
    } catch ( err ) {
      logger.error( '❌ Error fetching all messages:', err.message );
      return [];
    }
  },
  
  fetchPrivateMessages: async function() {
    try {
      const url = buildUrl( cometchatApi.BASE_URL, [
        'v3',
        'users',
        config.COMETCHAT_RECEIVER_UID,
        'conversation'
      ], [
        [ 'conversationType', 'user' ],
        [ 'limit', 50 ],
        [ 'uid', config.BOT_UID ]
      ] );

      const res = await cometchatApi.apiClient.get( url );
      logger.debug(`fetchPrivateMessages res:${JSON.stringify(res.data.data, null, 2)}`)
      const msg = res.data.data.lastMessage;
      if ( msg ) {
        logger.debug( `📥 Private message from ${ msg.sender }: ${ msg.data?.text || '[No Text]' }, ID: ${ msg.id }, Sender: ${ msg.sender }` );
        // if (msg.data?.text?.startsWith(config.COMMAND_SWITCH)) {
        //   return [msg]; // Return an array for consistency
        // }
      } else {
        logger.debug( '📥 No private messages found.' );
      }
    } catch ( err ) {
      logger.error( '❌ Error fetching private messages:', err.message );
    }
  },

  fetchGroupMessagesRaw: async function(params = []) {
    const defaultParams = [
      ['hideMessagesFromBlockedUsers', 0],
      ['unread', 0],
      ['withTags', 0],
      ['hideDeleted', 0],
      ['affix', 'append']
    ];

    try {
      const url = buildUrl( cometchatApi.BASE_URL, [
        'v3.0', 
        'groups', 
        config.HANGOUT_ID, 
        'messages'
      ], [
        ...defaultParams, 
        ...params
      ] );

      const res = await cometchatApi.apiClient.get(url);
      return res.data?.data || [];
    } catch (err) {
      logger.error('❌ Error fetching group messages:', err.message);
      return [];
    }
  },

  // Mark User Conversation As Read endpoint
  markMessageAsInterracted: async function() {
    try {
      const url = `${cometchatApi.BASE_URL}/v3/users/${config.COMETCHAT_RECEIVER_UID}/conversation/read`;
      const headers = {
        ...cometchatApi.headers,
        'accept': 'application/json',
        'content-type': 'application/json'
      };
      // logger.debug(`Attempting to mark conversation as read. UserID: ${config.COMETCHAT_RECEIVER_UID}, URL: ${url}, Request Headers: ${JSON.stringify(headers)}`);
      const response = await axios.post(url, {}, { headers });
      // logger.debug('✅ Marked conversation as read:', JSON.stringify(response.data, null, 2));
      // logger.debug('Response status:', response.status);
      // logger.debug('Response headers:', JSON.stringify(response.headers));
    } catch (err) {
      logger.error(`❌ Error marking conversation as read for user ${config.COMETCHAT_RECEIVER_UID}:`, err.response?.data || err.message);
      logger.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      if (err.response) {
        logger.error('Full error response:', JSON.stringify(err.response, null, 2));
        logger.error('Response status:', err.response.status);
        logger.error('Response headers:', JSON.stringify(err.response.headers));
      }
    }
  },

  returnLatestGroupMessageId: async function() {
    const MAX_LOOKBACK_MINUTES = 10;
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i <= MAX_LOOKBACK_MINUTES; i++) {
      const lookbackTimestamp = now - i * 60;

      const url = buildUrl(cometchatApi.BASE_URL, [
        'v3.0', 'groups', config.HANGOUT_ID, 'messages'
      ], [
        ['per_page', 1],
        ['hideMessagesFromBlockedUsers', 0],
        ['unread', 0],
        ['undelivered', 0],
        ['withTags', 0],
        ['hideDeleted', 0],
        ['affix', 'append'],
        ['updatedAt', lookbackTimestamp]
      ]);

      try {
        const res = await cometchatApi.apiClient.get(url);
        const messages = res.data?.data;

        if (Array.isArray(messages) && messages.length > 0) {
          const latest = messages[0];
          logger.debug(`✅ Found message: ID ${latest.id} at sentAt ${latest.sentAt} (lookback ${i}m)`);
          return latest.id;
        }
        logger.debug(`🔍 No messages at ${lookbackTimestamp} (${i} min ago)`);
      } catch (err) {
        logger.error(`❌ Error fetching messages at lookback ${i}m:`, err.message);
        return null;
      }
    }

    logger.warn('⚠️ No messages found in lookback window');
    return null;
  },
  
  listGroupMembers: async function() {
    logger.debug(`Starting listGroupMembers`)
    const url = buildUrl(cometchatApi.BASE_URL, [
      'v3.0', 'groups', config.HANGOUT_ID, 'members'
    ], [
      ['limit', 500],
      ['uid', config.BOT_UID]
    ]);

    try {
      const res = await cometchatApi.apiClient.get(url);

      // Extract only the fields we need from each member
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        const simplifiedMembers = res.data.data.map(member => ({
          name: member.name,
          uid: member.uid,
          conversationId: member.conversationId
        }));

        simplifiedMembers.forEach(member => {
          logger.debug(`- ${member.name} (${member.uid}): ${member.conversationId}`);
        });
        logger.debug(`Group members (${simplifiedMembers.length}):`);

      } else {
        logger.debug('No members found or unexpected response format');
      }

      return res.data;
    } catch (err) {
      logger.error(`❌ Error fetching group members: ${err.message}`);
      return null;
    }
  }
};

module.exports = {
  messageService
};
