const { logger } = require('../lib/logging.js');

function userLeft(...args) {
  logger.debug('userLeft.js handler called');
}

module.exports = userLeft;
