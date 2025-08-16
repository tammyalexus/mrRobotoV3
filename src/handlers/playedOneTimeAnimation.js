const { logger } = require('../lib/logging.js');

function playedOneTimeAnimation(...args) {
  logger.debug('playedOneTimeAnimation.js handler called');
}

module.exports = playedOneTimeAnimation;
