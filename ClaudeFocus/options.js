async function render() {
  const state = await getState();

  // status
  const badge = document.getElementById("statusBadge");
  const toggleBtn = document.getElementById("toggleBtn");
  badge.textContent = state.enabled ? "ON" : "OFF";
  badge.className = "badge " + (state.enabled ? "on" : "off");
  if (state.enabled) {
    toggleBtn.textContent = "Turn off (solve math)";
    toggleBtn.onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL("unlock.html") });
  } else {
    toggleBtn.textContent = "Turn on";
    toggleBtn.onclick = async () => {
      await chrome.runtime.sendMessage({ type: "SET_ENABLED_ON" });
      render();
    };
  }

  // blocklist
  const list = document.getElementById("blocklist");
  list.innerHTML = "";
  if (state.blocklist.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No sites blocked yet.";
    list.appendChild(li);
  }
  for (const entry of state.blocklist) {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = entry;
    const removeBtn = document.createElement("button");
    removeBtn.className = "danger";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = async () => {
      await chrome.runtime.sendMessage({ type: "REMOVE_BLOCK_ENTRY", entry });
      render();
    };
    li.appendChild(label);
    li.appendChild(removeBtn);
    list.appendChild(li);
  }

  // difficulty
  const d = state.difficulty || {};
  document.getElementById("problemCount").value = d.problemCount ?? 3;
  document.getElementById("maxNumber").value = d.maxNumber ?? 50;
  document.getElementById("multiplyMax").value = d.multiplyMax ?? 12;
  const ops = d.operations || ["+", "-", "*"];
  document.getElementById("opPlus").checked = ops.includes("+");
  document.getElementById("opMinus").checked = ops.includes("-");
  document.getElementById("opMul").checked = ops.includes("*");

  // stats
  const tbody = document.getElementById("statsBody");
  tbody.innerHTML = "";
  const entries = Object.entries(state.attempts || {}).sort((a, b) => b[1].count - a[1].count);
  document.getElementById("noStats").style.display = entries.length ? "none" : "block";
  for (const [site, rec] of entries) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${site}</td><td>${rec.count}</td><td>${formatTime(rec.lastAttempt)}</td>`;
    tbody.appendChild(tr);
  }
}

document.getElementById("addBtn").addEventListener("click", async () => {
  const input = document.getElementById("newEntry");
  const entry = input.value.trim();
  if (!entry) return;
  await chrome.runtime.sendMessage({ type: "ADD_BLOCK_ENTRY", entry });
  input.value = "";
  render();
});

document.getElementById("newEntry").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("addBtn").click();
});

document.getElementById("saveDifficultyBtn").addEventListener("click", async () => {
  const operations = [];
  if (document.getElementById("opPlus").checked) operations.push("+");
  if (document.getElementById("opMinus").checked) operations.push("-");
  if (document.getElementById("opMul").checked) operations.push("*");
  const difficulty = {
    problemCount: Math.max(1, Number(document.getElementById("problemCount").value) || 3),
    maxNumber: Math.max(1, Number(document.getElementById("maxNumber").value) || 50),
    multiplyMax: Math.max(2, Number(document.getElementById("multiplyMax").value) || 12),
    operations: operations.length ? operations : ["+", "-"]
  };
  await chrome.runtime.sendMessage({ type: "SET_DIFFICULTY", difficulty });
  render();
});

document.getElementById("resetStatsBtn").addEventListener("click", async () => {
  if (!confirm("Clear all recorded attempts and unlock history?")) return;
  await chrome.runtime.sendMessage({ type: "RESET_STATS" });
  render();
});

render();
