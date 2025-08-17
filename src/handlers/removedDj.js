const services = require('../services/serviceContainer.js');

function removedDj(...args) {
  services.logger.debug('removedDj.js handler called');
}

module.exports = removedDj;
