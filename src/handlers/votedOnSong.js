const { logger } = require('../lib/logging.js');

function votedOnSong(...args) {
  logger.debug('votedOnSong.js handler called');
}

module.exports = votedOnSong;
