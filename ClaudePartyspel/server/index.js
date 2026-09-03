// ── ENTRY POINT ──────────────────────────────────────────────────────────────
// Starts one HTTP server that does three things:
//   1. serves the static host + player pages from public/
//   2. exposes GET /api/modes  (list of game modes) and GET /qr (join QR code)
//   3. upgrades /ws to a WebSocket used for all realtime traffic
//
// Run it with:  npm start        (or: node server/index.js)
// Override the port with:  PORT=4000 npm start

const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const { primaryLocalIPv4, localIPv4Addresses } = require('./net');
const { createStaticServer } = require('./staticServer');
const { GameManager } = require('./gameManager');
const modes = require('./modes');
const CHARACTERS = require('./characters');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const serveStatic = createStaticServer(PUBLIC_DIR);
const game = new GameManager();

// QR code is optional — if `npm install` hasn't run yet we still work,
// just without the picture.
let qrcode = null;
try {
  qrcode = require('qrcode');
} catch {
  /* qrcode not installed — /qr will 404 and the terminal skips the QR art */
}

// ── HTTP ────────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // List of game modes, for the host UI + the pages' dynamic script loading.
  if (url.pathname === '/api/modes') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(modes.listModes()));
    return;
  }

  // The fixed character roster (id, name, colour, emoji, optional imageUrl).
  if (url.pathname === '/api/characters') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(CHARACTERS));
    return;
  }

  // QR code for the join URL, as an SVG image.
  if (url.pathname === '/qr') {
    if (!qrcode) {
      res.writeHead(404);
      res.end('qrcode package not installed');
      return;
    }
    const target = game.joinUrl || `http://${primaryLocalIPv4()}:${PORT}/`;
    qrcode.toString(target, { type: 'svg', margin: 1 }, (err, svg) => {
      if (err) {
        res.writeHead(500);
        res.end('qr error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      res.end(svg);
    });
    return;
  }

  serveStatic(req, res, url.pathname);
});

// ── WEBSOCKET ───────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket) => {
  socket.on('message', (data) => game.handleMessage(socket, data.toString()));
  socket.on('close', () => game.handleClose(socket));
  socket.on('error', () => {
    /* a 'close' event always follows — clean up there */
  });
});

// ── START ───────────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  const ip = primaryLocalIPv4();
  const joinUrl = `http://${ip}:${PORT}/`;
  game.setJoinUrl(joinUrl);

  console.log('\n  ClaudePartyspel\n  ' + '─'.repeat(40));
  console.log(`  Host-skärm (denna dator):  http://localhost:${PORT}/host`);
  console.log(`  Spelare joinar här:        ${joinUrl}`);

  const all = localIPv4Addresses();
  if (all.length > 1) {
    console.log('\n  Fungerar inte länken? Prova en annan nätverksadress:');
    for (const n of all.slice(1)) {
      console.log(`    http://${n.address}:${PORT}/   (${n.name})`);
    }
  }
  if (all.length === 0) {
    console.log('\n  OBS: hittade ingen lokal nätverksadress — är WiFi på?');
  }

  const done = () => console.log('\n  Ctrl+C för att stänga servern.\n');
  if (qrcode) {
    qrcode.toString(joinUrl, { type: 'terminal', small: true }, (err, art) => {
      if (!err) console.log('\n' + art);
      done();
    });
  } else {
    console.log('\n  (Kör "npm install" för QR-kod i terminalen och på host-skärmen.)');
    done();
  }
});
