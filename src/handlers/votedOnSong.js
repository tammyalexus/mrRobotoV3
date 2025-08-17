const services = require('../services/serviceContainer.js');

function votedOnSong(...args) {
  services.logger.debug('votedOnSong.js handler called');
}

module.exports = votedOnSong;
