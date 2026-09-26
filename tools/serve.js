// Local dev server for Battle Scissors (no dependencies; needs Node.js).
//   node tools/serve.js [port] [--open]
// Serves the project folder over http (ES modules don't load from file://) on all network interfaces (default port
// 8000; if it's busy, the next free one up to 9 higher, and the printed/opened addresses use that one),
// so a phone on the same Wi-Fi can open the printed LAN address. --open launches the default browser.
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { exec } = require('child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const port = Number(args.find(a => /^\d+$/.test(a))) || 8000;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8', '.webmanifest': 'application/manifest+json', '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(root, rel);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});
// A busy port (another copy already running, or some other app) falls through to the next one, a few times over.
const MAX_TRIES = 10;
let tryPort = port;
server.on('error', err => {
  if (err.code === 'EADDRINUSE' && tryPort < port + MAX_TRIES - 1) {
    console.log(`Port ${tryPort} is busy, trying ${tryPort + 1}...`);
    server.listen(++tryPort, '0.0.0.0');
    return;
  }
  console.error(err.code === 'EADDRINUSE' ? `Ports ${port}-${tryPort} are all busy. Try: node tools/serve.js ${tryPort + 1}` : err.message);
  process.exit(1);
});
server.listen(port, '0.0.0.0');
server.on('listening', () => {
  const port = tryPort, local = `http://localhost:${port}/`;
  console.log(`Battle Scissors is running.\n  This computer:  ${local}`);
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const n of nets || []) if (n.family === 'IPv4' && !n.internal) console.log(`  Phone (same Wi-Fi): http://${n.address}:${port}/`);
  }
  console.log('Close this window (or press Ctrl+C) to stop.');
  if (args.includes('--open')) {
    const cmd = process.platform === 'win32' ? `start "" "${local}"` : process.platform === 'darwin' ? `open "${local}"` : `xdg-open "${local}"`;
    exec(cmd);
  }
});
