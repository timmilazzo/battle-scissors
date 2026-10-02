// Playtest run reports: kept in localStorage (last CONFIG.runsKept) and downloaded as JSON (the debug panel's export).
// No network calls here (analytics.js owns the game's only network traffic).
import { CONFIG as C } from './config.js';

const RUNS_KEY = 'battleScissors.runs';

export function loadRuns() {
  try { const a = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
export function saveRun(report) {
  const runs = loadRuns();
  runs.push(report);
  try { localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(-C.runsKept))); } catch (e) { /* storage full or blocked */ }
}

export function downloadJson(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
