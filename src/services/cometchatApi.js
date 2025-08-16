const axios = require('axios');
const config = require('../config.js');

const BASE_URL = `https://${config.COMETCHAT_API_KEY}.apiclient-us.cometchat.io`;

const headers = {
  'Content-Type': 'application/json',
  authtoken: config.CHAT_TOKEN,
  appid: config.COMETCHAT_API_KEY,
  onBehalfOf: config.BOT_UID,
  dnt: 1,
  origin: 'https://tt.live',
  referer: 'https://tt.live/',
  sdk: 'javascript@3.0.10'
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers
});

module.exports = {
  BASE_URL,
  headers,
  apiClient
};
