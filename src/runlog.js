// Playtest run reports: kept in localStorage (last CONFIG.runsKept), copied to the clipboard, or downloaded as JSON.
// No network calls; the only outbound action in the game is opening FEEDBACK_URL in a new tab.
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

// Clipboard with a fallback for browsers that block navigator.clipboard (e.g. plain-http LAN testing on a phone).
export function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
  return Promise.resolve(legacyCopy(text));
}
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* unsupported */ }
  ta.remove();
  return ok;
}

export function downloadJson(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
