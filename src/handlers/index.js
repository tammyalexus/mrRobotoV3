import message from './message.js'
import playedSong from './playedSong.js'
import userJoined from './userJoined.js'
import userLeft from './userLeft.js'
import playedOneTimeAnimation from "./playedOneTimeAnimation.js";
import votedOnSong from "./votedOnSong.js";
import addedDj from "./addedDj.js";
import removedDj from "./removedDj.js";
import nothingPlaying from "./nothingPlaying.js";

const handlers = {
  message,
  playedSong,
  userJoined,
  userLeft,
  playedOneTimeAnimation,
  votedOnSong,
  addedDj,
  removedDj,
  nothingPlaying
}

export default handlers;