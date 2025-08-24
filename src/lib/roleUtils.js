const ROLE_LEVELS = {
    'owner': 4,
    'coOwner': 3,
    'moderator': 2,
    'user': 1
};

const COMMAND_LEVELS = {
    'OWNER': ['owner', 'coOwner'],
    'MODERATOR': ['owner', 'coOwner', 'moderator'],
    'USER': ['owner', 'coOwner', 'moderator', 'user']
};

/**
 * Checks if a user has sufficient role level to execute a command
 * @param {string} userRole - The role of the user trying to execute the command
 * @param {string} requiredLevel - The minimum level required (OWNER, MODERATOR, or USER)
 * @returns {boolean} - Whether the user has sufficient permissions
 */
function hasPermission(userRole, requiredLevel) {
    const allowedRoles = COMMAND_LEVELS[requiredLevel];
    if (!allowedRoles) {
        throw new Error(`Invalid required level: ${requiredLevel}`);
    }
    return allowedRoles.includes(userRole);
}

module.exports = {
    ROLE_LEVELS,
    COMMAND_LEVELS,
    hasPermission
};
