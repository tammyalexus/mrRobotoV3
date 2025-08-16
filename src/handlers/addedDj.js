const { logger } = require('../lib/logging.js');

function addedDj(...args) {
  logger.debug('addedDj.js handler called');
}

module.exports = addedDj;
