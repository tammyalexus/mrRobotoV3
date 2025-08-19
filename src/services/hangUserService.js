const { logger } = require('../lib/logging.js');
const config = require('../config.js');
const { makeRequest } = require('../lib/buildUrl.js');

async function _fetchUserProfileByUuid(userUuid) {
  if (!userUuid || typeof userUuid !== 'string') {
    throw new Error('userUuid must be a non-empty string');
  }
  const commonHeaders = { Authorization: `Bearer ${config.BOT_USER_TOKEN}` }
  const path = `/api/user-service/profile/${encodeURIComponent(userUuid)}`;
  const url = `${config.TTFM_GATEWAY_BASE_URL}${path}`;
  
  // Debugging info (mask token)
  const maskedToken = typeof config.BOT_USER_TOKEN === 'string' && config.BOT_USER_TOKEN.length > 8
    ? `${config.BOT_USER_TOKEN.slice(0, 4)}...${config.BOT_USER_TOKEN.slice(-4)}`
    : '[unset]';
  logger.debug(`hangUserService._fetchUserProfileByUuid: uuid=${userUuid}`);
  logger.debug(`hangUserService._fetchUserProfileByUuid: url=${url}`);
  logger.debug(`hangUserService._fetchUserProfileByUuid: authToken=${maskedToken}`);

  const res = await makeRequest(url, { method: 'GET' }, commonHeaders);
  if (res && typeof res === 'object') {
    const keys = Object.keys(res);
    const hasNickname = Object.prototype.hasOwnProperty.call(res, 'nickname') || !!res?.data?.nickname;
    logger.debug(`hangUserService._fetchUserProfileByUuid: responseKeys=[${keys.join(', ')}], hasNickname=${hasNickname}`);
  } else {
    logger.debug(`hangUserService._fetchUserProfileByUuid: empty or non-object response`);
  }
  return res;
}

async function getUserNicknameByUuid(userUuid) {
  try {
    const profile = await _fetchUserProfileByUuid(userUuid);
    const nickname = profile?.nickname || profile?.data?.nickname;
    if (!nickname) {
      logger.debug(`hangUserService.getUserNicknameByUuid: nickname missing for uuid=${userUuid}, profilePreview=${JSON.stringify(profile).slice(0, 200)}...`);
      throw new Error('Nickname not found in response');
    }
    logger.debug(`hangUserService.getUserNicknameByUuid: resolved nickname="${nickname}" for uuid=${userUuid}`);
    return nickname;
  } catch (err) {
    logger.error(`hangUserService.getUserNicknameByUuid: error for uuid=${userUuid} -> ${err.message}`);
    throw new Error(`Unable to resolve nickname for UUID ${userUuid}: ${err.message}`);
  }
}

module.exports = {
  getUserNicknameByUuid
};


