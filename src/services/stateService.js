/**
 * Service to access hangout state information
 */
class StateService {
    constructor(hangoutState, services = null) {
        // Store both for backwards compatibility and future access
        this.hangoutState = hangoutState;
        this.services = services;
    }

    /**
     * Get the current hangout state (prefer services reference if available)
     * @returns {Object} Current hangout state
     * @private
     */
    _getCurrentState() {
        // Use services.hangoutState if available (for live updates), 
        // otherwise fall back to constructor hangoutState
        return (this.services?.hangoutState) || this.hangoutState;
    }

    /**
     * Returns current vote counts
     * @returns {Object} Object containing likes, dislikes, and stars counts
     */
    getVoteCounts() {
        const state = this._getCurrentState();
        return state.voteCounts || { likes: 0, dislikes: 0, stars: 0 };
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
        const state = this._getCurrentState();
        const settings = state.settings || {};
        return settings.name || 'our Hangout';
    }

    /**
     * Returns information about all users in the room
     * @returns {Array} Array of user objects with uuid, tokenRole, canDj, and highestRole
     * @private
     */
    _getAllUsers() {
        const state = this._getCurrentState();
        return state.allUsers || [];
    }

    /**
     * Returns information about current DJs
     * @returns {Array} Array of DJ objects
     * @private
     */
    _getDjs() {
        const state = this._getCurrentState();
        return state.djs || [];
    }

    /**
     * Returns information about the currently playing song
     * @returns {Object} Object containing song details and timing information
     * @private
     */
    _getNowPlaying() {
        const state = this._getCurrentState();
        return state.nowPlaying || null;
    }

    /**
     * Returns room settings
     * @returns {Object} Room settings including name, description, rules, etc.
     * @private
     */
    _getSettings() {
        const state = this._getCurrentState();
        return state.settings || {};
    }

    /**
     * Returns the current vibe meter value
     * @returns {number} Current vibe meter value
     * @private
     */
    _getVibeMeter() {
        const state = this._getCurrentState();
        return state.vibeMeter || 0;
    }

    /**
     * Returns all user data including profiles and positions
     * @returns {Object} Object containing detailed user data
     * @private
     */
    _getAllUserData() {
        const state = this._getCurrentState();
        return state.allUserData || {};
    }
}

module.exports = StateService;
