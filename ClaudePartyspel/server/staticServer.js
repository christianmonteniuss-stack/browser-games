// ── STATIC FILE SERVER ───────────────────────────────────────────────────────
// A deliberately tiny static server for the public/ folder. No dependency on
// express or similar — this is all we need to serve a handful of HTML/CSS/JS
// files on a LAN.

const fs = require('fs');
const path = require('path');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

/**
 * Build a request handler that serves files from `rootDir`.
 *
 * Two friendly routes are added on top of raw file lookup:
 *   GET /       -> public/player/index.html   (what phones open)
 *   GET /host   -> public/host/index.html     (what the host screen opens)
 */
function createStaticServer(rootDir) {
  const root = path.resolve(rootDir);

  return function serveStatic(req, res, urlPath) {
    let rel;
    try {
      rel = decodeURIComponent(urlPath);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('400 Bad Request');
      return;
    }
    if (rel === '/' || rel === '') rel = '/player/index.html';
    else if (rel === '/host' || rel === '/host/') rel = '/host/index.html';

    // Resolve inside root and refuse anything that climbs out of it.
    const filePath = path.join(root, path.normalize(rel));
    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    fs.readFile(filePath, (err, buf) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      const type =
        CONTENT_TYPES[path.extname(filePath).toLowerCase()] ||
        'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
  };
}

module.exports = { createStaticServer };
