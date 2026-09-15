const params = new URLSearchParams(location.search);
const site = params.get("site") || "";

document.getElementById("site").textContent = site;

getState().then((state) => {
  const rec = (state.attempts || {})[site];
  document.getElementById("attemptCount").textContent = rec ? rec.count : 0;
});

document.getElementById("backBtn").addEventListener("click", () => {
  history.length > 1 ? history.back() : (location.href = "about:blank");
});

document.getElementById("unlockBtn").addEventListener("click", () => {
  location.href = chrome.runtime.getURL("unlock.html");
});
