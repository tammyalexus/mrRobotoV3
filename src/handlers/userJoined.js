const { logger } = require('../lib/logging.js');

function userJoined(...args) {
  logger.debug('userJoined.js handler called');
}

module.exports = userJoined;
