// ── LOCAL NETWORK ADDRESS DETECTION ──────────────────────────────────────────
// The server binds to 0.0.0.0 so it is reachable on every network interface,
// but the host screen needs ONE concrete URL to show as a QR code. These
// helpers pick the most likely "phone can reach this" LAN address.

const os = require('os');

/**
 * All non-internal IPv4 addresses of this machine, best guess first.
 * @returns {{ name: string, address: string }[]}
 */
function localIPv4Addresses() {
  const nets = os.networkInterfaces();
  const results = [];

  for (const [name, addrs] of Object.entries(nets)) {
    for (const addr of addrs || []) {
      // Node <18 reports family as the string 'IPv4'; Node >=18 as the number 4.
      const isIPv4 = addr.family === 'IPv4' || addr.family === 4;
      if (isIPv4 && !addr.internal) {
        results.push({ name, address: addr.address });
      }
    }
  }

  // Prefer the classic private-LAN ranges a home/office router hands out.
  const rank = (ip) => {
    if (ip.startsWith('192.168.')) return 0;
    if (ip.startsWith('10.')) return 1;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 2;
    return 3;
  };
  results.sort((a, b) => rank(a.address) - rank(b.address));
  return results;
}

/** The single best-guess LAN address, or loopback if the machine is offline. */
function primaryLocalIPv4() {
  const list = localIPv4Addresses();
  return list.length ? list[0].address : '127.0.0.1';
}

module.exports = { localIPv4Addresses, primaryLocalIPv4 };
