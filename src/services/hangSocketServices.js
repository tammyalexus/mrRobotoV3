const { logger } = require('../lib/logging.js');
const config = require('../config.js');

// Action constants for socket actions
const ActionName = {
  voteOnSong: 'voteOnSong'
};

const hangSocketServices = {
  /**
   * Send an upvote for the current song
   * @param {Object} socket - The socket connection object
   */
  upVote: async function(socket) {
    try {
      logger.debug(`hangSocketServices.upVote: Sending upvote for room ${config.HANGOUT_ID}`);
      
      await socket.action(ActionName.voteOnSong, {
        roomUuid: config.HANGOUT_ID,
        userUuid: config.BOT_UID,
        songVotes: { like: true }
      });
      
      logger.debug(`hangSocketServices.upVote: Successfully sent upvote`);
    } catch (err) {
      logger.error(`hangSocketServices.upVote: Error sending upvote - ${err.message}`);
      throw err;
    }
  },

  /**
   * Send a downvote for the current song
   * @param {Object} socket - The socket connection object
   */
  downVote: async function(socket) {
    try {
      logger.debug(`hangSocketServices.downVote: Sending downvote for room ${config.HANGOUT_ID}`);
      
      await socket.action(ActionName.voteOnSong, {
        roomUuid: config.HANGOUT_ID,
        userUuid: config.BOT_UID,
        songVotes: { like: false }
      });
      
      logger.debug(`hangSocketServices.downVote: Successfully sent downvote`);
    } catch (err) {
      logger.error(`hangSocketServices.downVote: Error sending downvote - ${err.message}`);
      throw err;
    }
  }
};

module.exports = {
  hangSocketServices
};
