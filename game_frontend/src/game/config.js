/**
 * Game configuration and constants.
 */

export const GAME_CONFIG = {
  lanes: 3,
  laneWidth: 70,
  playerSize: 40,
  playerColor: "#37d354",
  gravity: 0.7,
  jumpVelocity: -12,
  moveVelocity: 5,
  obstacleSpeed: 5,
  obstacleMinGap: 160,
  obstacleMaxGap: 350,
  powerUpSpeed: 5,
  powerUpChance: 0.2,
  gameSpeedIncrease: 0.05,
  maxGameSpeed: 14,
  canvasWidth: 360,
  canvasHeight: 500,
  backgroundColor: "#222934",
  groundHeight: 60
};

export const POWER_UPS = [
  {
    type: "magnet",
    color: "#ffc600",
    duration: 4000
  },
  {
    type: "shield",
    color: "#32aaff",
    duration: 3500
  }
];
