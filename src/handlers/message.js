const services = require('../services/serviceContainer.js');

function message(...args) {
  services.logger.debug('message.js handler called');
}

module.exports = message;
