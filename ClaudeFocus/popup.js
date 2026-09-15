async function refresh() {
  const state = await getState();
  const badge = document.getElementById("statusBadge");
  const toggleBtn = document.getElementById("toggleBtn");

  badge.textContent = state.enabled ? "ON" : "OFF";
  badge.className = "badge " + (state.enabled ? "on" : "off");

  document.getElementById("siteCount").textContent = state.blocklist.length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  let attemptsToday = 0;
  for (const rec of Object.values(state.attempts || {})) {
    for (const ts of rec.history || []) {
      if (ts >= todayStart.getTime()) attemptsToday++;
    }
  }
  document.getElementById("attemptsToday").textContent = attemptsToday;

  if (state.enabled) {
    toggleBtn.textContent = "Turn off (solve math)";
    toggleBtn.onclick = () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("unlock.html") });
      window.close();
    };
  } else {
    toggleBtn.textContent = "Turn on";
    toggleBtn.onclick = async () => {
      await chrome.runtime.sendMessage({ type: "SET_ENABLED_ON" });
      refresh();
    };
  }
}

document.getElementById("optionsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

refresh();
