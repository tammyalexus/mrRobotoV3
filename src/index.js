import { sendPrivateMessage, sendGroupMessage } from './services/messageService.js';
import { startPolling } from './tasks/pollMessages.js';

(async () => {
  try {
    await sendPrivateMessage();
    await sendGroupMessage();
    startPolling(5000);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();

// const { v4: uuidv4 } = require('uuid');
// require('dotenv').config();
// const axios = require('axios');
//
// const {
//   COMETCHAT_API_KEY,
//   COMETCHAT_APP_ID,
//   BOT_UID,
//   COMETCHAT_RECEIVER_UID,
//   HANGOUT_ID,
//   CHAT_AVATAR_ID,
//   CHAT_NAME,
//   CHAT_COLOUR
// } = process.env;
//
// const BASE_URL = `https://${COMETCHAT_API_KEY}.apiclient-us.cometchat.io`;
//
// const headers = {
//   'Content-Type': 'application/json',
//   'authtoken': COMETCHAT_APP_ID,
//   'appId': COMETCHAT_API_KEY
// };
//
// async function sendPrivateMessage() {
//   const theMessage = 'Hello Mr. Roboto version 3!';
//  
//   const customData = {
//     message: theMessage,
//     avatarId: CHAT_AVATAR_ID,
//     userName: CHAT_NAME,
//     color: `#${ CHAT_COLOUR }`,
//     mentions: [],
//     userUuid: BOT_UID,
//     badges: [ 'VERIFIED', 'STAFF' ],
//     id: uuidv4()
//   }
//
//   const payload = {
//     receiver: COMETCHAT_RECEIVER_UID,
//     receiverType: 'user',
//     category: 'message',
//     type: 'text',
//     data: {
//       text: theMessage,
//       metadata: {
//         chatMessage: customData
//       }
//     }
//   };
//
//   const response = await axios.post(`${BASE_URL}/v3.0/messages`, payload, { headers });
//   console.log('✅ Private message sent:', JSON.stringify(response.data,  null, 2) );
// }
//
// async function sendGroupMessage() {
//   const theMessage = 'Hello Mr. Roboto version 3!';
//
//   const customData = {
//     message: theMessage,
//     avatarId: CHAT_AVATAR_ID,
//     userName: CHAT_NAME,
//     color: `#${ CHAT_COLOUR }`,
//     mentions: [],
//     userUuid: BOT_UID,
//     badges: [ 'VERIFIED', 'STAFF' ],
//     id: uuidv4()
//   }
//
//   const payload = {
//     receiver: HANGOUT_ID,
//     receiverType: 'group',
//     category: 'message',
//     type: 'text',
//     data: {
//       text: theMessage,
//       metadata: {
//         chatMessage: customData
//       }
//
//     }
//   };
//
//   const response = await axios.post(`${BASE_URL}/v3.0/messages`, payload, { headers });
//   console.log('✅ Group message sent:', JSON.stringify(response.data,  null, 2) );
// }
//
// async function fetchPrivateMessages() {
//
//   // const paths = [
//   //   'v3',
//   //   'conversations'
//   // ]
//   const paths = [
//     'v3',
//     'users',
//     COMETCHAT_RECEIVER_UID,
//     'conversation'
//   ]
//   const searchParams = [
//     [ 'conversationType', 'user' ],
//     [ 'limit', 50 ],
//     [ 'uid', BOT_UID ]
//   ]
//
//   const pmHeaders = {
//     accept: 'application/json',
//     apikey: COMETCHAT_APP_ID
//   };
//  
//   const url = buildUrl( BASE_URL, paths, searchParams )
//   console.log(headers);
//   console.log( await url);
//   const response = await axios.get( await url, {
//     headers
//   });
//   const msg = response.data.data.lastMessage;
//   if (msg) {
//     console.log(`📥 Private message from ${msg.sender}: ${msg.data?.text || '[No Text]'}`);
//   } else {
//     console.log('📥 No messages found.');
//   }  // console.log('📥 Private messages:', JSON.stringify(response.data,  null, 2) );
// }
//
// async function buildUrl ( host, paths = [], searchParams, protocol = 'https' ) {
//   const url = new URL( paths.join( '/' ), `${ host }` )
//   url.search = new URLSearchParams( searchParams )
//   return url
// }
//
// async function fetchGroupMessages() {
//   const messageLimit = 50
//   const paths = [
//     'v3.0',
//     'groups',
//     HANGOUT_ID,
//     'messages'
//   ]
//   const searchParams = [
//     [ 'per_page', messageLimit ],
//     [ 'hideMessagesFromBlockedUsers', 0 ],
//     [ 'unread', 0 ],
//     [ 'undelivered', 1 ],
//     [ 'withTags', 0 ],
//     [ 'hideDeleted', 0 ],
//     [ 'affix', 'append' ],
//     [ 'id', 25323881 ]
//   ]
//
//   const url = buildUrl( BASE_URL, paths, searchParams )
//   console.log( await url);
//   const response = await axios.get( await url, {
//     headers
//   });
//   console.log('📥 Group messages:', response.data.data.map(msg => `${msg.sender}: ${msg.data.text}`));
// }
//
// (async () => {
//   try {
//     await sendPrivateMessage();
//     await sendGroupMessage();
//     setInterval(() => {
//       fetchGroupMessages().catch(console.error);
//     }, 5000);
//
//     setInterval(() => {
//       fetchPrivateMessages().catch(console.error);
//     }, 5000);  
//   } 
//   catch (error) {
//     console.error('❌ Error:', error.response?.data || error.message);
//   }
// })();
