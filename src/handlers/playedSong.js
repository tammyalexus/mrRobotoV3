
// Timer reference stored on services to persist between calls
if ( !global.playedSongTimer ) global.playedSongTimer = null;

/**
 * Extracts song information from the state patch
 * @param {Object} message - The stateful message containing patch data
 * @returns {Object|null} Song info object or null if not found
 */
function extractSongInfo ( message ) {
  const statePatch = message.statePatch || [];

  let djUuid = null;
  let artistName = null;
  let trackName = null;

  // Look through the patches to find the song and DJ information
  for ( const patch of statePatch ) {
    if ( patch.op === 'replace' ) {
      if ( patch.path === '/djs/0/uuid' ) {
        djUuid = patch.value;
      } else if ( patch.path === '/nowPlaying/song/artistName' ) {
        artistName = patch.value;
      } else if ( patch.path === '/nowPlaying/song/trackName' ) {
        trackName = patch.value;
      }
    }
  }

  // Only return song info if we have all required pieces
  if ( djUuid && artistName && trackName ) {
    return { djUuid, artistName, trackName };
  }

  return null;
}

/**
 * Announces the new song to the public chat
 * @param {Object} songInfo - Song information object
 * @param {Object} services - Services container
 */
async function announceSong ( songInfo, services ) {
  try {
    // Get now playing message template from data service, fallback to default if not found
    services.logger.debug( 'Getting now playing message template from dataService...' );
    const messageTemplate = services.dataService.getValue( 'nowPlayingMessage' ) || "{username} is now playing {trackName} by {artistName}";
    services.logger.debug( `Retrieved now playing message template: ${ messageTemplate }` );

    // Replace placeholders with actual values
    const djMention = services.messageService.formatMention( songInfo.djUuid );
    const announcement = messageTemplate
      .replace( '{username}', djMention )
      .replace( '{trackName}', songInfo.trackName )
      .replace( '{artistName}', songInfo.artistName );

    services.logger.debug( `Announcing new song: ${ announcement }` );
    await services.messageService.sendGroupMessage( announcement, { services } );
    services.logger.debug( '✅ Song announcement sent successfully' );
  } catch ( error ) {
    services.logger.error( `Failed to announce song: ${ error.message }` );
  }
}

function playedSong ( message, state, services ) {
  services.logger.debug( 'playedSong.js handler called' );

  try {
    // Extract and announce song information
    const songInfo = extractSongInfo( message );
    if ( songInfo ) {
      services.logger.debug( `New song detected: ${ songInfo.trackName } by ${ songInfo.artistName } (DJ: ${ songInfo.djUuid })` );
      // Don't await to avoid blocking the timer logic
      announceSong( songInfo, services );
    }

    const nowPlaying = services.hangoutState?.nowPlaying;

    // Cancel any existing timer
    if ( global.playedSongTimer ) {
      clearTimeout( global.playedSongTimer );
      services.logger.debug( 'Existing playedSong timer cancelled' );
      global.playedSongTimer = null;
    }

    if ( nowPlaying ) {
      // Start a new timer for 90 seconds
      services.logger.debug( 'Starting playedSong timer for 90 seconds' );
      global.playedSongTimer = setTimeout( async () => {
        try {
          services.logger.debug( 'playedSong timer expired, calling upVote' );
          await services.hangSocketServices.upVote( services.socket );
        } catch ( err ) {
          services.logger.error( 'Error in playedSong timer upVote:', err );
        }
        global.playedSongTimer = null;
      }, 90000 );
    } else {
      services.logger.debug( 'nowPlaying is null, no timer started' );
    }
  } catch ( error ) {
    services.logger.error( `Error in playedSong handler: ${ error.message }` );
  }
}

module.exports = playedSong;
