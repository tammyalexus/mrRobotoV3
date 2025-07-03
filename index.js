const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const axios = require('axios');

setInterval(fetchPrivateMessages, 5000); // Poll every 5 seconds

const {
  COMETCHAT_API_KEY,
  COMETCHAT_APP_ID,
  COMETCHAT_UID,
  COMETCHAT_RECEIVER_UID,
  COMETCHAT_GROUP_ID,
  CHAT_AVATAR_ID,
  CHAT_NAME,
  CHAT_COLOUR
} = process.env;

const BASE_URL = `https://${COMETCHAT_API_KEY}.apiclient-us.cometchat.io/v3`;

const headers = {
  'Content-Type': 'application/json',
  'authtoken': COMETCHAT_APP_ID,
  'appId': COMETCHAT_API_KEY
};

async function sendPrivateMessage() {
  const theMessage = 'Hello Mr. Roboto version 3!';
  
  const customData = {
    message: theMessage,
    avatarId: CHAT_AVATAR_ID,
    userName: CHAT_NAME,
    color: `#${ CHAT_COLOUR }`,
    mentions: [],
    userUuid: COMETCHAT_UID,
    badges: [ 'VERIFIED', 'STAFF' ],
    id: uuidv4()
  }

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

  const response = await axios.post(`${BASE_URL}/messages`, payload, { headers });
  console.log('✅ Private message sent:', JSON.stringify(response.data,  null, 2) );
}

async function sendGroupMessage() {
  const theMessage = 'Hello Mr. Roboto version 3!';

  const customData = {
    message: theMessage,
    avatarId: CHAT_AVATAR_ID,
    userName: CHAT_NAME,
    color: `#${ CHAT_COLOUR }`,
    mentions: [],
    userUuid: COMETCHAT_UID,
    badges: [ 'VERIFIED', 'STAFF' ],
    id: uuidv4()
  }

  const payload = {
    receiver: COMETCHAT_GROUP_ID,
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

  const response = await axios.post(`${BASE_URL}/messages`, payload, { headers });
  console.log('✅ Group message sent:', JSON.stringify(response.data,  null, 2) );
}

async function fetchPrivateMessages() {
  const response = await axios.get(`${BASE_URL}/messages?receiver=${COMETCHAT_UID}&receiverType=user`, {
    headers
  });

  console.log('📥 Private messages:', response.data.data.map(msg => `${msg.sender}: ${msg.data.text}`));
}


async function fetchGroupMessages() {
  const response = await axios.get(`${BASE_URL}/messages?receiver=${COMETCHAT_GROUP_ID}&receiverType=group`, {
    headers
  });
  console.log('📥 Group messages:', response.data.data.map(msg => `${msg.sender}: ${msg.data.text}`));
}

(async () => {
  try {
    await sendPrivateMessage();
    await sendGroupMessage();
    await fetchGroupMessages();
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
})();
