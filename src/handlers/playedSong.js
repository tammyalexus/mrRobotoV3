
// Timer reference stored on services to persist between calls
if ( !global.playedSongTimer ) global.playedSongTimer = null;

/**
 * Extracts song information from the state patch and full state
 * @param {Object} message - The stateful message containing patch data
 * @param {Object} services - Services container for accessing hangout state
 * @returns {Object|null} Song info object or null if not found
 */
function extractSongInfo ( message, services ) {
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
      } else if ( patch.path === '/nowPlaying' && patch.value?.song ) {
        // Handle case where entire nowPlaying object is replaced
        artistName = patch.value.song.artistName;
        trackName = patch.value.song.trackName;
      }
    }
  }

  // If we have song info but no DJ UUID from patch, try to get it from full state
  if ( !djUuid && ( artistName || trackName ) ) {
    if ( services.hangoutState?.djs && services.hangoutState.djs.length > 0 ) {
      djUuid = services.hangoutState.djs[0].uuid;
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
    const messageTemplate = services.dataService.getValue( 'nowPlayingMessage' ) || "{username} is now playing {trackName} by {artistName}";

    // Replace placeholders with actual values
    const djMention = services.messageService.formatMention( songInfo.djUuid );
    
    const announcement = messageTemplate
      .replace( '{username}', djMention )
      .replace( '{trackName}', songInfo.trackName )
      .replace( '{artistName}', songInfo.artistName );
    
    await services.messageService.sendGroupMessage( announcement, { services } );
  } catch ( error ) {
    services.logger.error( `Failed to announce song: ${ error.message }` );
  }
}

function playedSong ( message, state, services ) {
  try {
    // Extract and announce song information
    const songInfo = extractSongInfo( message, services );
    
    if ( songInfo && services.featuresService.isFeatureEnabled( 'nowPlayingMessage' ) ) {
      // Only announce if the feature is enabled
      announceSong( songInfo, services );
    }

    const nowPlaying = services.hangoutState?.nowPlaying;

    // Cancel any existing timer
    if ( global.playedSongTimer ) {
      clearTimeout( global.playedSongTimer );
      global.playedSongTimer = null;
    }

    if ( nowPlaying ) {
      // Start a new timer for 90 seconds
      global.playedSongTimer = setTimeout( async () => {
        try {
          await services.hangSocketServices.upVote( services.socket );
        } catch ( err ) {
          services.logger.error( 'Error in playedSong timer upVote:', err );
        }
        global.playedSongTimer = null;
      }, 90000 );
    }
  } catch ( error ) {
    services.logger.error( `Error in playedSong handler: ${ error.message }` );
    services.logger.error( `Error stack: ${ error.stack }` );
  }
}

module.exports = playedSong;
