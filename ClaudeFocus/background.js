importScripts("common.js");

// The currently-active unlock challenge is kept in chrome.storage.session
// (not the page) so answers are checked in the background, and so the
// challenge survives the service worker being unloaded mid-flow.
async function getActiveChallenge() {
  const { activeChallenge } = await chrome.storage.session.get("activeChallenge");
  return activeChallenge || null;
}
async function setActiveChallenge(challenge) {
  await chrome.storage.session.set({ activeChallenge: challenge });
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // main frame only

  const state = await getState();
  if (!state.enabled) return;

  const entry = findMatchingEntry(details.url, state.blocklist);
  if (!entry) return;

  await recordAttempt(entry);

  const blockedUrl = chrome.runtime.getURL(
    `blocked.html?site=${encodeURIComponent(entry)}&from=${encodeURIComponent(details.url)}`
  );
  chrome.tabs.update(details.tabId, { url: blockedUrl });
});

async function recordAttempt(entry) {
  const state = await getState();
  const attempts = state.attempts || {};
  const record = attempts[entry] || { count: 0, lastAttempt: 0, history: [] };
  record.count += 1;
  record.lastAttempt = Date.now();
  record.history.push(record.lastAttempt);
  if (record.history.length > 50) record.history = record.history.slice(-50);
  attempts[entry] = record;
  await setState({ attempts });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then(sendResponse);
  return true; // keep the channel open for the async response
});

async function handleMessage(msg) {
  switch (msg.type) {
    case "GET_STATE":
      return getState();

    case "SET_ENABLED_ON":
      // Turning ON never requires a challenge.
      await setState({ enabled: true });
      return { ok: true };

    case "START_UNLOCK_CHALLENGE": {
      const state = await getState();
      const problems = generateProblems(state.difficulty);
      await setActiveChallenge({
        answers: problems.map((p) => p.answer),
        createdAt: Date.now()
      });
      return { problems: problems.map((p) => ({ id: p.id, text: p.text })) };
    }

    case "SUBMIT_UNLOCK_ANSWERS": {
      const state = await getState();
      const log = state.unlockLog || [];
      const activeChallenge = await getActiveChallenge();
      if (!activeChallenge) {
        return { ok: false, error: "No active challenge. Request new problems." };
      }
      const correct = activeChallenge.answers.every(
        (ans, i) => Number(msg.answers[i]) === ans
      );
      log.push({ timestamp: Date.now(), success: correct });
      if (log.length > 100) log.splice(0, log.length - 100);
      if (correct) {
        await setActiveChallenge(null);
        await setState({ enabled: false, unlockLog: log });
      } else {
        await setState({ unlockLog: log });
      }
      return { ok: correct };
    }

    case "ADD_BLOCK_ENTRY": {
      const state = await getState();
      const entry = (msg.entry || "").trim().toLowerCase();
      if (!entry) return { ok: false, error: "Empty entry" };
      if (!state.blocklist.includes(entry)) {
        state.blocklist.push(entry);
        await setState({ blocklist: state.blocklist });
      }
      return { ok: true, blocklist: state.blocklist };
    }

    case "REMOVE_BLOCK_ENTRY": {
      const state = await getState();
      const blocklist = state.blocklist.filter((e) => e !== msg.entry);
      await setState({ blocklist });
      return { ok: true, blocklist };
    }

    case "SET_DIFFICULTY": {
      await setState({ difficulty: msg.difficulty });
      return { ok: true };
    }

    case "RESET_STATS": {
      await setState({ attempts: {}, unlockLog: [] });
      return { ok: true };
    }

    default:
      return { ok: false, error: "Unknown message type" };
  }
}
