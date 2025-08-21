
// Timer reference stored on services to persist between calls
if (!global.playedSongTimer) global.playedSongTimer = null;

function playedSong(message, state, services) {
  services.logger.debug('playedSong.js handler called');

  const nowPlaying = services.hangoutState?.nowPlaying;

  // Cancel any existing timer
  if (global.playedSongTimer) {
    clearTimeout(global.playedSongTimer);
    services.logger.debug('Existing playedSong timer cancelled');
    global.playedSongTimer = null;
  }

  if (nowPlaying) {
    // Start a new timer for 90 seconds
    services.logger.debug('Starting playedSong timer for 90 seconds');
    global.playedSongTimer = setTimeout(async () => {
      try {
        services.logger.debug('playedSong timer expired, calling upVote');
        await services.hangSocketServices.upVote(services.socket);
      } catch (err) {
        services.logger.error('Error in playedSong timer upVote:', err);
      }
      global.playedSongTimer = null;
    }, 90000);
  } else {
    services.logger.debug('nowPlaying is null, no timer started');
  }
}

module.exports = playedSong;
