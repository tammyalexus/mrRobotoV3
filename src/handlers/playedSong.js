const { logger } = require('../lib/logging.js');

function playedSong(...args) {
  logger.debug('playedSong.js handler called');
}

module.exports = playedSong;
