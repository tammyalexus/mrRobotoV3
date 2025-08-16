const { logger } = require('../lib/logging.js');

function message(...args) {
  logger.debug('message.js handler called');
}

module.exports = message;
