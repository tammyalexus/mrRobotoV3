const { logger } = require('../lib/logging.js');

function nothingPlaying(...args) {
  logger.debug('nothingPlaying.js handler called');
}

module.exports = nothingPlaying;
