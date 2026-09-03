// Small shared helpers for the arena mode and its round types.

/** Fisher–Yates copy. */
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = { shuffled, pickRandom };
