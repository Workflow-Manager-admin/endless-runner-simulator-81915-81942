/**
 * Placeholder for REST API calls - currently stubs.
 * Can be extended to interact with backend Flask service.
 */
// PUBLIC_INTERFACE
export async function submitScore(score) {
  // Stub: Replace with real POST to backend when ready.
  return Promise.resolve({ success: true });
}

// PUBLIC_INTERFACE
export async function fetchHighScores() {
  // Stub: Replace with real GET from backend when available.
  return Promise.resolve([
    { name: "DemoRunner", score: 12345 },
    { name: "TestUser", score: 9999 }
  ]);
}
