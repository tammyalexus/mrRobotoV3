const services = require('../services/serviceContainer.js');

function nothingPlaying(...args) {
  services.logger.debug('nothingPlaying.js handler called');
}

module.exports = nothingPlaying;
