import React, { useState, useEffect } from "react";
import GameEngine from "./GameEngine";
import audioManager from "./audio";
import { submitScore, fetchHighScores } from "./api";

// PUBLIC_INTERFACE
/**
 * GameUI - overall endless runner shell: state, start/pause, overlays, results.
 */
function GameUI() {
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [highScores, setHighScores] = useState([]);

  useEffect(() => {
    audioManager.muteAll(muted);
  }, [muted]);

  // Fetch stub high scores at end
  async function handleShowScores() {
    setShowScores(true);
    const result = await fetchHighScores();
    setHighScores(result);
  }

  function handleRestart() {
    setRunning(true);
    setGameOver(false);
    setScore(0);
  }

  function handleStart() {
    setRunning(true);
    setGameOver(false);
    setScore(0);
  }

  async function handleGameOver({ score: finalScore }) {
    setScore(finalScore);
    setRunning(false);
    setGameOver(true);
    audioManager.play("die");
    // "submit" score for extensibility (no effect)
    await submitScore(finalScore);
  }

  return (
    <main>
      <nav className="runner-nav" style={{ margin: "0 auto", width: 340, display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
        <span style={{ fontWeight: "bold", fontSize: 20, color: "#75ffd1" }}>Endless Runner 🏃‍♂️</span>
        <span>
          <button className="btn" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted(m => !m)}>{muted ? "🔇" : "🔊"}</button>
        </span>
      </nav>
      {!running && !gameOver && (
        <section style={{ textAlign: "center", marginTop: 30 }}>
          <h1 style={{ color: "#eee", fontWeight: 700 }}>Run, Dodge, Collect!</h1>
          <p style={{ maxWidth: 350, margin: "auto", color: "#b6ebee" }}>
            Use <kbd>←</kbd> <kbd>→</kbd> or swipe, and <kbd>↑</kbd>/<kbd>⏫</kbd> to jump.
            Avoid obstacles, collect power-ups for extra abilities, and beat your high score!<br /><br />
            Works on both desktop and mobile.
          </p>
          <button className="btn btn-large" onClick={handleStart} autoFocus style={{ fontSize: 19, marginTop: 10 }}>
            Start Game 🚀
          </button>
        </section>
      )}
      <div style={{
        minHeight: 508,
        display: running || gameOver ? "block" : "none",
        marginTop: 14
      }}>
        <GameEngine
          running={running}
          onGameOver={handleGameOver}
          onScore={setScore}
        />
      </div>
      {gameOver && (
        <section style={{
          background: "#11222d",
          color: "#daf6fa",
          padding: 18,
          width: 302,
          borderRadius: 12,
          margin: "36px auto 0 auto",
          textAlign: "center",
          boxShadow: "0 6px 18px #1118 0.6"
        }}>
          <h2>Game Over</h2>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#ffbb7a" }}>Your Score: {score}</p>
          <div>
            <button className="btn btn-large" onClick={handleRestart} style={{ margin: 6 }}>Play Again</button>
            <button className="btn" onClick={handleShowScores} style={{ margin: 6 }}>Show High Scores</button>
          </div>
          {showScores && (
            <div style={{ marginTop: 13 }}>
              <h3 style={{ fontSize: 18, color: "#c6d8f6" }}>High Scores</h3>
              <ol style={{ textAlign: "left", margin: "auto", maxWidth: 200 }}>
                {highScores.map((hs, idx) => (
                  <li key={idx}><span style={{ fontWeight: 700 }}>{hs.name}</span>: <span>{hs.score}</span></li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
      <footer style={{ textAlign: "center", margin: 20, color: "#74bcd7" }}>
        <small>
          Keyboard: <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> or swipe/jump on mobile. Power-ups: shield (🛡️), magnet (🧲).<br />
          &copy; 2024 Endless Runner Demo. <a href="https://github.com/" rel="noopener noreferrer" style={{ color: "#c5fcef" }}>Code</a>
        </small>
      </footer>
    </main>
  );
}

export default GameUI;
