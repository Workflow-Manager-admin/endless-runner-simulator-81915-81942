/**
 * AudioManager for playing sound effects in-game.
 * Handles play/stop, mute, and volume adjustments.
 */
const audioSources = {
  jump: '/sounds/jump.wav',
  die: '/sounds/gameover.wav',
  collect: '/sounds/collect.wav',
  powerup: '/sounds/powerup.wav',
  score: '/sounds/score.wav'
};

class AudioManager {
  constructor() {
    this.tracks = {};
    this.muted = false;
    this.loadAudios();
  }

  loadAudios() {
    Object.keys(audioSources).forEach(key => {
      const audio = new window.Audio(audioSources[key]);
      audio.preload = 'auto';
      this.tracks[key] = audio;
    });
  }

  // PUBLIC_INTERFACE
  play(key) {
    if (this.muted) return;
    const audio = this.tracks[key];
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  }

  // PUBLIC_INTERFACE
  stop(key) {
    const audio = this.tracks[key];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // PUBLIC_INTERFACE
  muteAll(muted) {
    this.muted = muted;
    Object.values(this.tracks).forEach(audio => {
      audio.muted = muted;
    });
  }
}

const audioManager = new AudioManager();
export default audioManager;
