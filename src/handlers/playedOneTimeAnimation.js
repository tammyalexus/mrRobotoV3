const services = require('../services/serviceContainer.js');

function playedOneTimeAnimation(...args) {
  services.logger.debug('playedOneTimeAnimation.js handler called');
}

module.exports = playedOneTimeAnimation;
