const playlistService = {
  currentPlaylist: [],
  
  addSong(song) {
    this.currentPlaylist.push(song);
    return song;
  },
  
  getCurrentSong() {
    return this.currentPlaylist[0] || null;
  },
  
  removeSong(index) {
    return this.currentPlaylist.splice(index, 1)[0];
  },
  
  clearPlaylist() {
    this.currentPlaylist = [];
  },
  
  getPlaylist() {
    return this.currentPlaylist;
  }
};

module.exports = playlistService;
