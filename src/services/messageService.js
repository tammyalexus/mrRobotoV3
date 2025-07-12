import { v4 as uuidv4 } from 'uuid';
import { apiClient, BASE_URL } from './cometchatApi.js';
import buildUrl from '../lib/buildUrl.js';
import {
  BOT_UID,
  COMETCHAT_RECEIVER_UID,
  HANGOUT_ID,
  CHAT_AVATAR_ID,
  CHAT_NAME,
  CHAT_COLOUR
} from '../config.js';

export async function sendPrivateMessage() {
  const theMessage = 'Hello Mr. Roboto version 3!';
  const customData = {
    message: theMessage,
    avatarId: CHAT_AVATAR_ID,
    userName: CHAT_NAME,
    color: `#${CHAT_COLOUR}`,
    mentions: [],
    userUuid: BOT_UID,
    badges: ['VERIFIED', 'STAFF'],
    id: uuidv4()
  };

  const payload = {
    receiver: COMETCHAT_RECEIVER_UID,
    receiverType: 'user',
    category: 'message',
    type: 'text',
    data: {
      text: theMessage,
      metadata: {
        chatMessage: customData
      }
    }
  };

  const res = await apiClient.post(`/v3.0/messages`, payload);
  console.log('✅ Private message sent:', JSON.stringify(res.data, null, 2));
}

export async function sendGroupMessage() {
  const theMessage = 'Hello Mr. Roboto version 3!';
  const customData = {
    message: theMessage,
    avatarId: CHAT_AVATAR_ID,
    userName: CHAT_NAME,
    color: `#${CHAT_COLOUR}`,
    mentions: [],
    userUuid: BOT_UID,
    badges: ['VERIFIED', 'STAFF'],
    id: uuidv4()
  };

  const payload = {
    receiver: HANGOUT_ID,
    receiverType: 'group',
    category: 'message',
    type: 'text',
    data: {
      text: theMessage,
      metadata: {
        chatMessage: customData
      }
    }
  };

  const res = await apiClient.post(`/v3.0/messages`, payload);
  console.log('✅ Group message sent:', JSON.stringify(res.data, null, 2));
}

export async function fetchPrivateMessages() {
  const url = buildUrl(BASE_URL, [
    'v3',
    'users',
    COMETCHAT_RECEIVER_UID,
    'conversation'
  ], [
    ['conversationType', 'user'],
    ['limit', 50],
    ['uid', BOT_UID]
  ]);

  const res = await apiClient.get(url);
  const msg = res.data.data.lastMessage;
  if (msg) {
    console.log(`📥 Private message from ${msg.sender}: ${msg.data?.text || '[No Text]'}`);
  } else {
    console.log('📥 No private messages found.');
  }
}

export async function fetchGroupMessages() {
  const url = buildUrl(BASE_URL, [
    'v3.0', 'groups', HANGOUT_ID, 'messages'
  ], [
    ['per_page', 50],
    ['hideMessagesFromBlockedUsers', 0],
    ['unread', 0],
    ['undelivered', 1],
    ['withTags', 0],
    ['hideDeleted', 0],
    ['affix', 'append'],
    ['id', 25323881]
  ]);

  const res = await apiClient.get(url);
  const messages = res.data.data.map(msg => `${msg.sender}: ${msg.data.text}`);
  console.log('📥 Group messages:', messages);
}
