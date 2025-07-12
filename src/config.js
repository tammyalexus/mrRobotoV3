const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  COMETCHAT_API_KEY:  process.env.COMETCHAT_API_KEY,
  COMETCHAT_APP_ID:   process.env.COMETCHAT_APP_ID,
  BOT_UID: process.env.BOT_UID,
  COMETCHAT_RECEIVER_UID: process.env.COMETCHAT_RECEIVER_UID,
  HANGOUT_ID:  process.env.HANGOUT_ID,
  CHAT_AVATAR_ID:   process.env.CHAT_AVATAR_ID,
  CHAT_NAME: process.env.CHAT_NAME,
  CHAT_COLOUR: process.env.CHAT_COLOUR,
};
