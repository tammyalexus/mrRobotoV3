/**
 * Service to access hangout state information
 */
class StateService {
    constructor(hangoutState) {
        this.hangoutState = hangoutState;
    }

    /**
     * Returns current vote counts
     * @returns {Object} Object containing likes, dislikes, and stars counts
     */
    getVoteCounts() {
        return this.hangoutState.voteCounts || { likes: 0, dislikes: 0, stars: 0 };
    }

    /**
     * Returns the role of a specific user
     * @param {string} uuid - The UUID of the user to get the role for
     * @returns {string} One of "owner", "moderator", "coOwner", or "user"
     * @throws {Error} If the user is not found in the room
     */
    getUserRole(uuid) {
        const allUsers = this._getAllUsers();
        const user = allUsers.find(u => u.uuid === uuid);
        if (!user) {
            throw new Error(`User with UUID ${uuid} not found in the room`);
        }
        return user.highestRole || "user";
    }

    /**
     * Returns the name of the hangout
     * @returns {string} The name of the hangout, or 'Our Hangout' if not set
     */
    getHangoutName() {
        const settings = this._getSettings();
        return settings.name || 'our Hangout';
    }

    /**
     * Returns information about all users in the room
     * @returns {Array} Array of user objects with uuid, tokenRole, canDj, and highestRole
     * @private
     */
    _getAllUsers() {
        return this.hangoutState.allUsers || [];
    }

    /**
     * Returns information about all DJs in the room
     * @returns {Array} Array of DJ objects including their next songs
     * @private
     */
    _getDjs() {
        return this.hangoutState.djs || [];
    }

    /**
     * Returns information about the currently playing song
     * @returns {Object} Object containing song details and timing information
     * @private
     */
    _getNowPlaying() {
        return this.hangoutState.nowPlaying || null;
    }

    /**
     * Returns room settings
     * @returns {Object} Room settings including name, description, rules, etc.
     * @private
     */
    _getSettings() {
        return this.hangoutState.settings || {};
    }

    /**
     * Returns the current vibe meter value
     * @returns {number} Current vibe meter value
     * @private
     */
    _getVibeMeter() {
        return this.hangoutState.vibeMeter || 0;
    }

    /**
     * Returns all user data including profiles and positions
     * @returns {Object} Object containing detailed user data
     * @private
     */
    _getAllUserData() {
        return this.hangoutState.allUserData || {};
    }
}

module.exports = StateService;
