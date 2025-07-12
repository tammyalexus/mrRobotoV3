import axios from 'axios';
import { COMETCHAT_API_KEY, COMETCHAT_APP_ID } from '../config.js';

export const BASE_URL = `https://${COMETCHAT_API_KEY}.apiclient-us.cometchat.io`;

export const headers = {
  'Content-Type': 'application/json',
  'authtoken': COMETCHAT_APP_ID,
  'appId': COMETCHAT_API_KEY
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers
});
