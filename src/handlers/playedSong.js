
// Timer reference stored on services to persist between calls
if ( !global.playedSongTimer ) global.playedSongTimer = null;

// Storage for previous song info to persist between playedSong calls
if ( !global.previousPlayedSong ) global.previousPlayedSong = null;

/**
 * Announces the just-finished song with vote counts to the public chat
 * @param {Object} previousSongInfo - Previous song information object
 * @param {Object} services - Services container
 */
async function announceJustPlayed ( previousSongInfo, services ) {
  try {
    services.logger.debug( '[playedSong] Starting announceJustPlayed with data:', previousSongInfo );

    const messageTemplate = services.dataService.getValue( 'justPlayedMessage' ) ||
      `{username} played...
      {trackName} by {artistName}
      Stats: 👍 {likes} 👎 {dislikes} ❤️ {stars}`;

    services.logger.debug( '[playedSong] Using justPlayedMessage template:', messageTemplate );

    // Replace placeholders with actual values
    const djMention = services.messageService.formatMention( previousSongInfo.djUuid );
    services.logger.debug( '[playedSong] DJ mention formatted as:', djMention );

    const announcement = messageTemplate
      .replace( '{username}', djMention )
      .replace( '{trackName}', previousSongInfo.trackName )
      .replace( '{artistName}', previousSongInfo.artistName )
      .replace( '{likes}', previousSongInfo.voteCounts.likes || 0 )
      .replace( '{dislikes}', previousSongInfo.voteCounts.dislikes || 0 )
      .replace( '{stars}', previousSongInfo.voteCounts.stars || 0 );

    services.logger.info( '[playedSong] Sending justPlayed announcement:', announcement );
    await services.messageService.sendGroupMessage( announcement, { services } );
    services.logger.debug( '[playedSong] Successfully sent justPlayed announcement' );
  } catch ( error ) {
    services.logger.error( `[playedSong] Failed to announce just played song: ${ error.message }` );
    services.logger.error( `[playedSong] Error stack: ${ error.stack }` );
  }
}

/**
 * Extracts song information from the state patch and full state
 * @param {Object} message - The stateful message containing patch data
 * @param {Object} services - Services container for accessing hangout state
 * @returns {Object|null} Song info object or null if not found
 */
function extractSongInfo ( message, services ) {
  services.logger.debug( '[playedSong] Extracting song info from patches...' );

  const statePatch = message.statePatch || [];
  let djUuid = null;
  let artistName = null;
  let trackName = null;

  services.logger.debug( `[playedSong] Processing ${ statePatch.length } patches for song info` );

  // Look through the patches to find the song and DJ information
  for ( const patch of statePatch ) {
    if ( patch.op === 'replace' ) {
      if ( patch.path === '/djs/0/uuid' ) {
        djUuid = patch.value;
        services.logger.debug( `[playedSong] Found DJ UUID in patch: ${ djUuid }` );
      } else if ( patch.path === '/nowPlaying/song/artistName' ) {
        artistName = patch.value;
        services.logger.debug( `[playedSong] Found artist name in patch: ${ artistName }` );
      } else if ( patch.path === '/nowPlaying/song/trackName' ) {
        trackName = patch.value;
        services.logger.debug( `[playedSong] Found track name in patch: ${ trackName }` );
      } else if ( patch.path === '/nowPlaying' && patch.value?.song ) {
        // Handle case where entire nowPlaying object is replaced
        artistName = patch.value.song.artistName;
        trackName = patch.value.song.trackName;
        services.logger.debug( `[playedSong] Found full nowPlaying object in patch: ${ JSON.stringify( { artistName, trackName }, null, 2 ) }` );
      }
    }
  }

  // If we have song info but no DJ UUID from patch, try to get it from full state
  if ( !djUuid && ( artistName || trackName ) ) {
    if ( services.hangoutState?.djs && services.hangoutState.djs.length > 0 ) {
      djUuid = services.hangoutState.djs[ 0 ].uuid;
      services.logger.debug( '[playedSong] Got DJ UUID from hangout state:', djUuid );
    }
  }

  services.logger.debug( '[playedSong] Final extracted values:', { djUuid, artistName, trackName } );

  // Only return song info if we have all required pieces
  if ( djUuid && artistName && trackName ) {
    const songInfo = { djUuid, artistName, trackName };
    services.logger.debug( '[playedSong] Successfully extracted complete song info:', songInfo );
    return songInfo;
  }

  services.logger.debug( '[playedSong] Incomplete song info - missing required fields' );
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

async function playedSong ( message, state, services ) {
  try {
    services.logger.debug( `[playedSong] Handler called with message patches: ${ message.statePatch?.length || 0 } patches` );

    // Log all the patches for debugging
    if ( message.statePatch && message.statePatch.length > 0 ) {
      services.logger.debug( `[playedSong] State patches: ${ JSON.stringify( message.statePatch.map( p => ( { op: p.op, path: p.path, hasValue: !!p.value } ) ), null, 2 ) }` );
    }

    // Extract current song information from the patches
    const currentSongInfo = extractSongInfo( message, services );
    services.logger.debug( `[playedSong] Current song info extracted: ${ !!currentSongInfo }` );
    if ( currentSongInfo ) {
      services.logger.debug( `[playedSong] Current song data: ${ JSON.stringify( currentSongInfo, null, 2 ) }` );
    }

    // Get the stored previous song info from the last playedSong call
    const previousSongInfo = global.previousPlayedSong;
    services.logger.debug( `[playedSong] Previous stored song info: ${ !!previousSongInfo }` );
    if ( previousSongInfo ) {
      services.logger.debug( `[playedSong] Previous stored song data: ${ JSON.stringify( previousSongInfo, null, 2 ) }` );
    }

    // Check if justPlayed feature is enabled
    const justPlayedEnabled = services.featuresService.isFeatureEnabled( 'justPlayed' );
    services.logger.debug( `[playedSong] justPlayed feature enabled: ${ justPlayedEnabled }` );

    // Check if nowPlaying became null (song ended)
    const nowPlayingBecameNull = message.statePatch?.some( patch =>
      patch.op === 'replace' && patch.path === '/nowPlaying' && patch.value === null
    );

    // Announce the just-finished song if we have a previous song and either:
    // 1. Current song is different from previous, OR
    // 2. Song ended (nowPlaying became null)
    if ( previousSongInfo && justPlayedEnabled && ( currentSongInfo || nowPlayingBecameNull ) ) {
      let shouldAnnounce = false;

      if ( nowPlayingBecameNull ) {
        services.logger.debug( '[playedSong] Song ended (nowPlaying became null) - will announce justPlayed' );
        shouldAnnounce = true;
      } else if ( currentSongInfo ) {
        services.logger.debug( '[playedSong] Checking if current song is different from previous...' );

        const songChanged = (
          currentSongInfo.trackName !== previousSongInfo.trackName ||
          currentSongInfo.artistName !== previousSongInfo.artistName ||
          currentSongInfo.djUuid !== previousSongInfo.djUuid
        );

        services.logger.debug( `[playedSong] Song changed: ${ songChanged }` );
        if ( songChanged ) {
          const comparison = {
            newTrack: currentSongInfo.trackName,
            oldTrack: previousSongInfo.trackName,
            tracksDifferent: currentSongInfo.trackName !== previousSongInfo.trackName,
            newArtist: currentSongInfo.artistName,
            oldArtist: previousSongInfo.artistName,
            artistsDifferent: currentSongInfo.artistName !== previousSongInfo.artistName,
            newDJ: currentSongInfo.djUuid,
            oldDJ: previousSongInfo.djUuid,
            djsDifferent: currentSongInfo.djUuid !== previousSongInfo.djUuid
          };
          services.logger.debug( `[playedSong] Song comparison: ${ JSON.stringify( comparison, null, 2 ) }` );
          shouldAnnounce = true;
        } else {
          services.logger.debug( '[playedSong] Not announcing justPlayed - same song as previous' );
        }
      }

      if ( shouldAnnounce ) {
        services.logger.info( `[playedSong] Announcing justPlayed for: ${ previousSongInfo.trackName } by ${ previousSongInfo.artistName }` );

        // Use the stored vote counts (which get updated by votedOnSong and playedOneTimeAnimation handlers)
        // If no vote counts are stored, fall back to current hangout state
        const voteCounts = previousSongInfo.voteCounts || services.hangoutState?.voteCounts || { likes: 0, dislikes: 0, stars: 0 };
        const previousSongWithVotes = { ...previousSongInfo, voteCounts };

        await announceJustPlayed( previousSongWithVotes, services );
      }
    } else {
      if ( !previousSongInfo ) {
        services.logger.debug( '[playedSong] No justPlayed announcement - no previous song stored' );
      }
      if ( !justPlayedEnabled ) {
        services.logger.debug( '[playedSong] No justPlayed announcement - feature disabled' );
      }
      if ( !currentSongInfo && !nowPlayingBecameNull ) {
        services.logger.debug( '[playedSong] No justPlayed announcement - no current song info extracted and nowPlaying did not become null' );
      }
    }

    // Store the current song info for the next playedSong call
    if ( currentSongInfo ) {
      // Get current vote counts from hangout state
      const voteCounts = services.hangoutState?.voteCounts || { likes: 0, dislikes: 0, stars: 0 };

      global.previousPlayedSong = {
        ...currentSongInfo,
        voteCounts: { ...voteCounts } // Initialize with current vote counts
      };
      services.logger.debug( `[playedSong] Stored current song for next comparison: ${ JSON.stringify( global.previousPlayedSong, null, 2 ) }` );
    }

    // Announce the new song if the feature is enabled (after justPlayed announcement)
    if ( currentSongInfo && services.featuresService.isFeatureEnabled( 'nowPlayingMessage' ) ) {
      await announceSong( currentSongInfo, services );
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
