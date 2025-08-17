// Debug script to test CometChat group join operation
require('dotenv').config();
const axios = require('axios');

async function testGroupJoin() {
  console.log('=== Testing CometChat Group Join ===');
  
  const API_KEY = process.env.COMETCHAT_API_KEY;
  const APP_ID = process.env.COMETCHAT_APP_ID;
  const BOT_UID = process.env.BOT_UID;
  const GROUP_UID = process.env.HANGOUT_ID;

  console.log('API_KEY:', API_KEY);
  console.log('APP_ID:', APP_ID);
  console.log('BOT_UID:', BOT_UID);
  console.log('GROUP_UID:', GROUP_UID);

  const BASE_URL = `https://${API_KEY}.apiclient-us.cometchat.io`;
  console.log('BASE_URL:', BASE_URL);

  const headers = {
    'Content-Type': 'application/json',
    authtoken: APP_ID,
    appid: API_KEY,
    onBehalfOf: BOT_UID,
    dnt: 1,
    origin: 'https://tt.live',
    referer: 'https://tt.live/',
    sdk: 'javascript@3.0.10'
  };

  console.log('Headers:', JSON.stringify(headers, null, 2));

  const joinUrl = `${BASE_URL}/v3.0/groups/${GROUP_UID}/members`;
  console.log('Join URL:', joinUrl);

  try {
    console.log('🔄 Attempting to join group...');
    const response = await axios.post(joinUrl, {}, { headers });
    console.log('✅ JOIN SUCCESS! Status:', response.status);
    console.log('Join Response Data:', JSON.stringify(response.data, null, 2));
    
    // Wait 5 seconds for membership to propagate
    console.log('⏱️ Waiting 5 seconds for membership to propagate...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Now test if we can fetch messages
    console.log('🔄 Testing message fetch after join...');
    const messagesUrl = `${BASE_URL}/v3.0/groups/${GROUP_UID}/messages?per_page=5&hideMessagesFromBlockedUsers=0&unread=0&withTags=0&undelivered=1&hideDeleted=0&affix=append`;
    const messagesResponse = await axios.get(messagesUrl, { headers });
    console.log('✅ MESSAGES SUCCESS! Status:', messagesResponse.status);
    console.log('Messages count:', messagesResponse.data?.data?.length || 0);
    
  } catch (error) {
    if (error.response?.status === 417 && error.response?.data?.error?.code === 'ERR_ALREADY_JOINED') {
      console.log('✅ User already joined, testing message fetch...');
      
      // Wait 2 seconds and try fetching messages
      console.log('⏱️ Waiting 2 seconds for system consistency...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const messagesUrl = `${BASE_URL}/v3.0/groups/${GROUP_UID}/messages?per_page=5&hideMessagesFromBlockedUsers=0&unread=0&withTags=0&undelivered=1&hideDeleted=0&affix=append`;
        const messagesResponse = await axios.get(messagesUrl, { headers });
        console.log('✅ MESSAGES SUCCESS! Status:', messagesResponse.status);
        console.log('Messages count:', messagesResponse.data?.data?.length || 0);
      } catch (msgError) {
        console.log('❌ MESSAGES ERROR! Status:', msgError.response?.status);
        console.log('Error Message:', msgError.message);
        console.log('Response Data:', JSON.stringify(msgError.response?.data, null, 2));
      }
    } else {
      console.log('❌ ERROR! Status:', error.response?.status);
      console.log('Error Message:', error.message);
      console.log('Response Data:', JSON.stringify(error.response?.data, null, 2));
    }
  }
}

testGroupJoin();
