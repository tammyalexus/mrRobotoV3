const services = require('../services/serviceContainer.js');

function playedSong(...args) {
  services.logger.debug('playedSong.js handler called');
}

module.exports = playedSong;
