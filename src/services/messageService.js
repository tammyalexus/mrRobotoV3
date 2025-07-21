// src/services/messageService.js
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const buildUrl = require('../lib/buildUrl');
const cometchatApi = require('./cometchatApi.js');
const config = require('../config.js');

const RECEIVER_TYPE = {
  USER: "user",
  GROUP: "group"
};

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

const messageService = {
  buildCustomData,
  buildPayload,

  sendPrivateMessage: async function(theMessage) {
    try {
      const customData = await this.buildCustomData(theMessage);
      const payload = await this.buildPayload(config.COMETCHAT_RECEIVER_UID, RECEIVER_TYPE.USER, customData, theMessage);
      const response = await axios.post(`${cometchatApi.BASE_URL}/v3.0/messages`, payload, { headers: cometchatApi.headers });
      console.log('✅ Private message sent:', JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.error('❌ Failed to send private message:', err.response?.data || err.message);
    }
  },

  sendGroupMessage: async function( theMessage ) {
    try {
      const customData = await this.buildCustomData( theMessage );
      const payload = await this.buildPayload( config.HANGOUT_ID, RECEIVER_TYPE.GROUP, customData, theMessage )
      const response = await axios.post( `${ cometchatApi.BASE_URL }/v3.0/messages`, payload, { headers: cometchatApi.headers } );
      console.log( '✅ Group message sent:', JSON.stringify( response.data, null, 2 ) );
    } catch (err) {
      console.error('❌ Failed to send private message:', err.response?.data || err.message);
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
      const msg = res.data.data.lastMessage;
      if ( msg ) {
        console.log( `📥 Private message from ${ msg.sender }: ${ msg.data?.text || '[No Text]' }` );
      } else {
        console.log( '📥 No private messages found.' );
      }
    } catch ( err ) {
      console.error( '❌ Error fetching private messages:', err.message );
    }
  },

  fetchGroupMessages: async function() {
    try {
      const url = buildUrl( cometchatApi.BASE_URL, [
        'v3.0', 'groups', config.HANGOUT_ID, 'messages'
      ], [
        [ 'per_page', 50 ],
        [ 'hideMessagesFromBlockedUsers', 0 ],
        [ 'unread', 0 ],
        [ 'undelivered', 1 ],
        [ 'withTags', 0 ],
        [ 'hideDeleted', 0 ],
        [ 'affix', 'append' ],
        [ 'id', 25323881 ]
      ] );

      const res = await cometchatApi.apiClient.get( url );
      const messages = res.data.data.map( msg => `${ msg.sender }: ${ msg.data?.text || '[No Text]' }` );
      console.log( '📥 Group messages:', messages );
    } catch ( err ) {
      console.error( '❌ Error fetching group messages:', err.message );
    }
  }
};

module.exports = {
  messageService
};
