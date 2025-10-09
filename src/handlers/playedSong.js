
// Timer reference stored on services to persist between calls
if ( !global.playedSongTimer ) global.playedSongTimer = null;

/**
 * Captures the previous song information before it gets replaced by state patches
 * @param {Object} services - Services container for accessing hangout state
 * @returns {Object|null} Previous song info object or null if not found
 */
function capturePreviousSongInfo( services ) {
  try {
    const hangoutState = services.hangoutState;
    if ( !hangoutState?.nowPlaying?.song ) {
      return null;
    }

    const nowPlaying = hangoutState.nowPlaying;
    const djUuid = hangoutState.djs && hangoutState.djs.length > 0 ? hangoutState.djs[0].uuid : null;
    const voteCounts = hangoutState.voteCounts || { likes: 0, dislikes: 0, stars: 0 };

    if ( djUuid && nowPlaying.song.artistName && nowPlaying.song.trackName ) {
      return {
        djUuid,
        artistName: nowPlaying.song.artistName,
        trackName: nowPlaying.song.trackName,
        voteCounts: { ...voteCounts } // Create a copy to avoid reference issues
      };
    }

    return null;
  } catch ( error ) {
    return null;
  }
}

/**
 * Announces the just-finished song with vote counts to the public chat
 * @param {Object} previousSongInfo - Previous song information object
 * @param {Object} services - Services container
 */
async function announceJustPlayed( previousSongInfo, services ) {
  try {
    const messageTemplate = services.dataService.getValue( 'justPlayedMessage' ) || 
      "{username} just played {trackName} by {artistName} 👍{likes} 👎{dislikes} ⭐{stars}";

    // Replace placeholders with actual values
    const djMention = services.messageService.formatMention( previousSongInfo.djUuid );
    
    const announcement = messageTemplate
      .replace( '{username}', djMention )
      .replace( '{trackName}', previousSongInfo.trackName )
      .replace( '{artistName}', previousSongInfo.artistName )
      .replace( '{likes}', previousSongInfo.voteCounts.likes || 0 )
      .replace( '{dislikes}', previousSongInfo.voteCounts.dislikes || 0 )
      .replace( '{stars}', previousSongInfo.voteCounts.stars || 0 );
    
    await services.messageService.sendGroupMessage( announcement, { services } );
  } catch ( error ) {
    services.logger.error( `Failed to announce just played song: ${ error.message }` );
  }
}

/**
 * Extracts the new nowPlaying value from the state patch
 * @param {Object} message - The stateful message containing patch data
 * @returns {Object|null} The new nowPlaying value or undefined if not found in patch
 */
function extractNowPlayingFromPatch( message ) {
  const statePatch = message.statePatch || [];
  
  for ( const patch of statePatch ) {
    if ( patch.op === 'replace' && patch.path === '/nowPlaying' ) {
      return patch.value;
    }
  }
  
  return undefined; // Not found in patch
}

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
    // Capture the previous song info BEFORE extracting new song info
    const previousSongInfo = capturePreviousSongInfo( services );
    
    // Extract and announce new song information
    const songInfo = extractSongInfo( message, services );
    
    // Announce the just-finished song if the feature is enabled and we have previous song data
    // Only announce if there was actually a previous song that finished
    if ( previousSongInfo && services.featuresService.isFeatureEnabled( 'justPlayed' ) ) {
      // Check if this playedSong message indicates the end of a song (nowPlaying becomes null)
      // or if there's a new song replacing the previous one
      const newNowPlaying = extractNowPlayingFromPatch( message );
      
      // Only announce if the song is actually ending (nowPlaying becomes null) 
      // or if a different song is starting (different track/artist)
      const shouldAnnounce = newNowPlaying === null || 
        (newNowPlaying?.song && (
          newNowPlaying.song.trackName !== previousSongInfo.trackName ||
          newNowPlaying.song.artistName !== previousSongInfo.artistName
        ));
      
      if ( shouldAnnounce ) {
        announceJustPlayed( previousSongInfo, services );
      }
    }
    
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
