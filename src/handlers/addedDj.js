const services = require('../services/serviceContainer.js');

function addedDj(...args) {
  services.logger.debug('addedDj.js handler called');
}

module.exports = addedDj;
