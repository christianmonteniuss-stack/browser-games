// Shared helpers used by background, popup, options, and unlock pages.

const DEFAULT_DIFFICULTY = {
  problemCount: 3,
  operations: ["+", "-", "*"],
  maxNumber: 50,
  multiplyMax: 12
};

const DEFAULT_STATE = {
  enabled: false,
  blocklist: [],
  difficulty: DEFAULT_DIFFICULTY,
  attempts: {},   // { [entry]: { count: number, lastAttempt: number, history: number[] } }
  unlockLog: []   // [{ timestamp, success }]
};

function getState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_STATE, (items) => resolve(items));
  });
}

function setState(partial) {
  return new Promise((resolve) => {
    chrome.storage.local.set(partial, resolve);
  });
}

// Does a navigated URL match a blocklist entry?
// Entries with a "/" match as a substring of the full URL.
// Plain-domain entries match the hostname or any subdomain of it.
function matchesEntry(urlString, entry) {
  entry = entry.trim().toLowerCase();
  if (!entry) return false;
  try {
    if (entry.includes("/")) {
      return urlString.toLowerCase().includes(entry);
    }
    const host = new URL(urlString).hostname.toLowerCase();
    return host === entry || host.endsWith("." + entry);
  } catch (e) {
    return false;
  }
}

function findMatchingEntry(urlString, blocklist) {
  for (const entry of blocklist) {
    if (matchesEntry(urlString, entry)) return entry;
  }
  return null;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generates math problems according to a difficulty config.
// Returns [{ id, text, answer }]
function generateProblems(difficulty) {
  const cfg = Object.assign({}, DEFAULT_DIFFICULTY, difficulty || {});
  const ops = cfg.operations && cfg.operations.length ? cfg.operations : DEFAULT_DIFFICULTY.operations;
  const problems = [];
  for (let i = 0; i < cfg.problemCount; i++) {
    const op = ops[randInt(0, ops.length - 1)];
    let a, b, answer, text;
    if (op === "+") {
      a = randInt(1, cfg.maxNumber);
      b = randInt(1, cfg.maxNumber);
      answer = a + b;
      text = `${a} + ${b}`;
    } else if (op === "-") {
      a = randInt(1, cfg.maxNumber);
      b = randInt(1, cfg.maxNumber);
      if (b > a) [a, b] = [b, a];
      answer = a - b;
      text = `${a} - ${b}`;
    } else { // "*"
      a = randInt(2, cfg.multiplyMax);
      b = randInt(2, cfg.multiplyMax);
      answer = a * b;
      text = `${a} × ${b}`;
    }
    problems.push({ id: i, text, answer });
  }
  return problems;
}

function formatTime(ts) {
  if (!ts) return "never";
  const d = new Date(ts);
  return d.toLocaleString();
}
