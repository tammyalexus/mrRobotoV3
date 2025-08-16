const { logger } = require('../lib/logging.js');

function removedDj(...args) {
  logger.debug('removedDj.js handler called');
}

module.exports = removedDj;
