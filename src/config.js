const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  COMETCHAT_API_KEY: process.env.COMETCHAT_API_KEY,
  COMETCHAT_APP_ID: process.env.COMETCHAT_APP_ID,
  LOG_LEVEL: process.env.LOG_LEVEL,
  BOT_UID: process.env.BOT_UID,
  HANGOUT_ID: process.env.HANGOUT_ID,
  BOT_USER_TOKEN: process.env.BOT_USER_TOKEN,
  CHAT_AVATAR_ID: process.env.CHAT_AVATAR_ID,
  CHAT_NAME: process.env.CHAT_NAME,
  CHAT_COLOUR: process.env.CHAT_COLOUR,
  COMMAND_SWITCH: process.env.COMMAND_SWITCH,
  COMETCHAT_RECEIVER_UID: process.env.COMETCHAT_RECEIVER_UID,
  TTFM_GATEWAY_BASE_URL: process.env.TTFM_GATEWAY_BASE_URL,
};
