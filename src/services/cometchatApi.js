const axios = require('axios');
const { COMETCHAT_API_KEY, COMETCHAT_APP_ID } = require('../config.js');

const BASE_URL = `https://${COMETCHAT_API_KEY}.apiclient-us.cometchat.io`;

const headers = {
  'Content-Type': 'application/json',
  'authtoken': COMETCHAT_APP_ID,
  'appId': COMETCHAT_API_KEY
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
