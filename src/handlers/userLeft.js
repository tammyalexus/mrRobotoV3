const services = require('../services/serviceContainer.js');

function userLeft(...args) {
  services.logger.debug('userLeft.js handler called');
}

module.exports = userLeft;
