import React, { useRef, useEffect, useState, useCallback } from "react";
import { GAME_CONFIG, POWER_UPS } from "./config";
import * as logic from "./logic";
import audioManager from "./audio";

// PUBLIC_INTERFACE
/**
 * GameEngine - core endless runner component.
 * Handles rendering, controls, state, animation, and collisions.
 */
function GameEngine({ running, onGameOver, onScore }) {
  const canvasRef = useRef(null);

  // Core state
  const [frameId, setFrameId] = useState(null);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(GAME_CONFIG.obstacleSpeed);
  const [player, setPlayer] = useState({
    lane: 1,
    x: GAME_CONFIG.laneWidth,
    y: GAME_CONFIG.canvasHeight - GAME_CONFIG.groundHeight - GAME_CONFIG.playerSize,
    vy: 0,
    jumping: false,
    shield: false,
    magnet: false
  });
  const [obstacles, setObstacles] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [runningInternal, setRunningInternal] = useState(running);

  // Power-up timers
  const [activePowerUp, setActivePowerUp] = useState(null);
  const powerUpTimer = useRef(null);

  // Handle game loop
  const runGameLoop = useCallback(() => {
    let lastObstacleX = obstacles.length ? obstacles[obstacles.length - 1].x : GAME_CONFIG.canvasWidth;
    let newObstacles = obstacles.map(ob => ({ ...ob, x: ob.x - gameSpeed }));
    newObstacles = newObstacles.filter(ob => ob.x + ob.width > 0);

    // Spawn obstacle if far enough
    if (lastObstacleX < GAME_CONFIG.canvasWidth - logic.getRandomInt(GAME_CONFIG.obstacleMinGap, GAME_CONFIG.obstacleMaxGap)) {
      const newObstacle = logic.spawnObstacle(GAME_CONFIG, GAME_CONFIG.canvasWidth);
      newObstacle.y = GAME_CONFIG.canvasHeight - GAME_CONFIG.groundHeight - newObstacle.height;
      newObstacles.push(newObstacle);
    }

    let newPowerUps = powerUps.map(pw => ({ ...pw, x: pw.x - gameSpeed }));
    newPowerUps = newPowerUps.filter(pw => pw.x + pw.width > 0);

    // Spawn power-up with some chance
    if (Math.random() < GAME_CONFIG.powerUpChance && newPowerUps.length < 2) {
      const typeObj = POWER_UPS[logic.getRandomInt(0, POWER_UPS.length - 1)];
      const newPowerUp = logic.spawnPowerUp(GAME_CONFIG, GAME_CONFIG.canvasWidth, typeObj);
      newPowerUp.y = GAME_CONFIG.canvasHeight - GAME_CONFIG.groundHeight - newPowerUp.height - 4;
      newPowerUps.push(newPowerUp);
    }

    // Player jump physics
    let nextPlayer = { ...player };
    if (player.jumping) {
      nextPlayer.vy += GAME_CONFIG.gravity;
      nextPlayer.y += nextPlayer.vy;
      if (nextPlayer.y >= GAME_CONFIG.canvasHeight - GAME_CONFIG.groundHeight - GAME_CONFIG.playerSize) {
        nextPlayer.y = GAME_CONFIG.canvasHeight - GAME_CONFIG.groundHeight - GAME_CONFIG.playerSize;
        nextPlayer.jumping = false;
        nextPlayer.vy = 0;
      }
    }

    // Collision logic
    let died = false;
    for (let ob of newObstacles) {
      const col = logic.isColliding(
        { x: GAME_CONFIG.laneWidth * nextPlayer.lane, y: nextPlayer.y, width: GAME_CONFIG.playerSize, height: GAME_CONFIG.playerSize },
        { x: ob.x, y: ob.y, width: ob.width, height: ob.height }
      );
      if (col && !nextPlayer.shield) {
        died = true;
      }
      if (col && nextPlayer.shield) {
        audioManager.play("powerup");
        ob.speed = 0;
        ob.x = -200;
      }
    }

    // Power-up collection
    let pwrTypeGained = null;
    newPowerUps = newPowerUps.map(pw => {
      const col = logic.isColliding(
        { x: GAME_CONFIG.laneWidth * nextPlayer.lane, y: nextPlayer.y, width: GAME_CONFIG.playerSize, height: GAME_CONFIG.playerSize },
        { x: pw.x, y: pw.y, width: pw.width, height: pw.height }
      );
      if (col && !pw.collected) {
        pwrTypeGained = pw.type;
        pw.collected = true;
        pw.x = -100;
      }
      return pw;
    }).filter(pw => !pw.collected);

    // Power-up logic by type
    if (pwrTypeGained) {
      if (pwrTypeGained === "shield") {
        setActivePowerUp({ type: "shield", expires: Date.now() + POWER_UPS[1].duration });
        nextPlayer.shield = true;
        audioManager.play("powerup");
        clearTimeout(powerUpTimer.current);
        powerUpTimer.current = setTimeout(() => {
          setActivePowerUp(null);
          setPlayer(p => ({ ...p, shield: false }));
        }, POWER_UPS[1].duration);
      }
      if (pwrTypeGained === "magnet") {
        setActivePowerUp({ type: "magnet", expires: Date.now() + POWER_UPS[0].duration });
        nextPlayer.magnet = true;
        audioManager.play("powerup");
        clearTimeout(powerUpTimer.current);
        powerUpTimer.current = setTimeout(() => {
          setActivePowerUp(null);
          setPlayer(p => ({ ...p, magnet: false }));
        }, POWER_UPS[0].duration);
      }
    }

    // Update score per frame, difficulty increases
    let nextScore = score + 1;
    setScore(nextScore);
    if (nextScore % 400 === 0 && gameSpeed < GAME_CONFIG.maxGameSpeed) { // difficulty ramp
      setGameSpeed(prev => Math.min(prev + GAME_CONFIG.gameSpeedIncrease, GAME_CONFIG.maxGameSpeed));
    }
    onScore && onScore(nextScore);

    // Draw everything
    drawGame(nextPlayer, newObstacles, newPowerUps, nextScore);

    // Game over
    if (died) {
      audioManager.play("die");
      cancelAnimationFrame(frameId);
      setRunningInternal(false);
      onGameOver && onGameOver({ score: nextScore });
      return;
    }

    // Set new state and loop
    setPlayer(nextPlayer);
    setObstacles(newObstacles);
    setPowerUps(newPowerUps);
    setFrameId(requestAnimationFrame(runGameLoop));
  // eslint-disable-next-line
  }, [frameId, player, obstacles, powerUps, score, gameSpeed]);

  // Draw all elements
  function drawGame(plr, obs, pwrs, scoreVal) {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

    // Background
    ctx.fillStyle = GAME_CONFIG.backgroundColor;
    ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

    // Ground
    ctx.fillStyle = "#444";
    ctx.fillRect(
      0,
      GAME_CONFIG.canvasHeight - GAME_CONFIG.groundHeight,
      GAME_CONFIG.canvasWidth,
      GAME_CONFIG.groundHeight
    );

    // Lanes
    for (let i = 1; i < GAME_CONFIG.lanes; i++) {
      ctx.strokeStyle = "#1d232e";
      ctx.beginPath();
      ctx.moveTo(i * GAME_CONFIG.laneWidth, 0);
      ctx.lineTo(i * GAME_CONFIG.laneWidth, GAME_CONFIG.canvasHeight - GAME_CONFIG.groundHeight);
      ctx.stroke();
    }

    // Obstacles
    obs.forEach(ob => {
      ctx.fillStyle = ob.color;
      ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
      ctx.strokeStyle = "#a13422";
      ctx.strokeRect(ob.x, ob.y, ob.width, ob.height);
    });

    // Power-ups
    pwrs.forEach(pw => {
      ctx.beginPath();
      ctx.arc(
        pw.x + pw.width / 2,
        pw.y + pw.height / 2,
        pw.width / 2,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = pw.color;
      ctx.fill();
      ctx.strokeStyle = "#eee";
      ctx.stroke();
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.fillText(
        pw.type === "shield" ? "S" : "M",
        pw.x + pw.width / 2,
        pw.y + pw.height / 2 + 7
      );
    });

    // Player
    ctx.save();
    ctx.fillStyle = plr.shield ? "#a4d8ff" : GAME_CONFIG.playerColor;
    ctx.fillRect(GAME_CONFIG.laneWidth * plr.lane, plr.y, GAME_CONFIG.playerSize, GAME_CONFIG.playerSize);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(GAME_CONFIG.laneWidth * plr.lane, plr.y, GAME_CONFIG.playerSize, GAME_CONFIG.playerSize);

    // Face/eyes (simple style)
    ctx.beginPath();
    ctx.arc(GAME_CONFIG.laneWidth * plr.lane + 11, plr.y + 14, 3, 0, 2 * Math.PI);
    ctx.arc(GAME_CONFIG.laneWidth * plr.lane + 28, plr.y + 14, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();

    ctx.restore();

    // Score text
    ctx.font = "bold 20px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Score: ${scoreVal}`, 108, 28);

    // Power-up icon
    if (activePowerUp) {
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = activePowerUp.type === "shield" ? "#a4d8ff" : "#ffc600";
      ctx.fillText(
        activePowerUp.type === "shield" ? "🛡️ Shield!" : "🧲 Magnet!",
        285,
        44
      );
    }
  }

  // Handle keyboard and touch controls
  useEffect(() => {
    if (!runningInternal) return;

    function handleKey(e) {
      if (e.repeat) return;
      if (["ArrowLeft", "a", "A"].includes(e.key) && player.lane > 0) {
        setPlayer(p => ({ ...p, lane: p.lane - 1 }));
        audioManager.play("score");
      }
      if (["ArrowRight", "d", "D"].includes(e.key) && player.lane < GAME_CONFIG.lanes - 1) {
        setPlayer(p => ({ ...p, lane: p.lane + 1 }));
        audioManager.play("score");
      }
      if ((["ArrowUp", "w", "W", " "].includes(e.key) || e.key === " ") && !player.jumping) {
        setPlayer(p => ({ ...p, vy: GAME_CONFIG.jumpVelocity, jumping: true }));
        audioManager.play("jump");
      }
    }
    window.addEventListener("keydown", handleKey);

    // Touch/swipe controls
    let touchStartX = null, touchStartY = null;
    function handleTouchStart(e) {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }
    function handleTouchEnd(e) {
      if (!touchStartX || !touchStartY) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        // left/right swipe
        if (dx > 24 && player.lane < GAME_CONFIG.lanes - 1) {
          setPlayer(p => ({ ...p, lane: p.lane + 1 }));
          audioManager.play("score");
        }
        if (dx < -24 && player.lane > 0) {
          setPlayer(p => ({ ...p, lane: p.lane - 1 }));
          audioManager.play("score");
        }
      } else {
        // up swipe = jump
        if (dy < -22 && !player.jumping) {
          setPlayer(p => ({ ...p, vy: GAME_CONFIG.jumpVelocity, jumping: true }));
          audioManager.play("jump");
        }
      }
      touchStartX = null;
      touchStartY = null;
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [player, runningInternal]);

  // Start/stop loop control on running state
  useEffect(() => {
    setRunningInternal(running);
    if (running) {
      setFrameId(requestAnimationFrame(runGameLoop));
    } else {
      cancelAnimationFrame(frameId);
    }
    return () => {
      cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line
  }, [running]);

  // UI: canvas and accessibility controls
  return (
    <div className="game-engine-container" style={{
      width: GAME_CONFIG.canvasWidth,
      margin: "0 auto",
      background: "#15202b",
      borderRadius: 14,
      boxShadow: "0 4px 14px #1118 0.5"
    }}>
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.canvasWidth}
        height={GAME_CONFIG.canvasHeight}
        tabIndex={0}
        role="img"
        aria-label="Endless runner game"
        style={{
          outline: 'none',
          width: "100%",
          maxWidth: "100%",
          background: "#21263a"
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          marginTop: 6,
          marginBottom: 12
        }}
        aria-label="On-screen controls"
      >
        <button className="btn" onClick={() => setPlayer(p => ({ ...p, lane: Math.max(0, p.lane - 1) }))} aria-label="Move Left">⬅️</button>
        <button className="btn" onClick={() => setPlayer(p => (!p.jumping ? { ...p, vy: GAME_CONFIG.jumpVelocity, jumping: true } : p))} aria-label="Jump">⏫</button>
        <button className="btn" onClick={() => setPlayer(p => ({ ...p, lane: Math.min(GAME_CONFIG.lanes - 1, p.lane + 1) }))} aria-label="Move Right">➡️</button>
      </div>
    </div>
  );
}

export default GameEngine;
