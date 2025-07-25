/**
 * Core game logic helpers:
 * - Obstacle, power-up, score, and collision logic.
 */

// PUBLIC_INTERFACE
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// PUBLIC_INTERFACE
export function getRandomLane(lanes) {
  return getRandomInt(0, lanes - 1);
}

// PUBLIC_INTERFACE
export function spawnObstacle(config, canvasW) {
  const { lanes, laneWidth, obstacleSpeed, groundHeight } = config;
  return {
    x: canvasW + getRandomInt(0, 15),
    lane: getRandomLane(lanes),
    width: laneWidth - 14,
    height: 40,
    color: '#c64c2f',
    speed: obstacleSpeed,
    passed: false
  };
}

// PUBLIC_INTERFACE
export function spawnPowerUp(config, canvasW, typeObj) {
  const { laneWidth, powerUpSpeed, lanes } = config;
  return {
    x: canvasW + getRandomInt(10, 30),
    lane: getRandomLane(lanes),
    width: 30,
    height: 30,
    color: typeObj.color,
    type: typeObj.type,
    duration: typeObj.duration,
    speed: powerUpSpeed,
    collected: false
  };
}

// PUBLIC_INTERFACE
export function isColliding(a, b, offsetY = 0) {
  // a and b: {x, lane, width, height}
  // Player Y and H is managed in engine; offsetY is for jump
  const ax = a.x, bx = b.x;
  const overlapX = (ax + a.width) > bx && ax < (bx + b.width);
  const ay = a.y + offsetY, by = b.y;
  const overlapY = (ay + a.height) > by && ay < (by + b.height);
  // lane match for obstacles/power-ups
  return overlapX && overlapY;
}
