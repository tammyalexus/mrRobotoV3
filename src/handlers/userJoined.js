const services = require('../services/serviceContainer.js');

function userJoined(...args) {
  services.logger.debug('userJoined.js handler called');
}

module.exports = userJoined;
