# ClaudeFocus

A Chrome extension that blocks a list of sites you choose. Turning blocking
back **off** requires solving a set of math problems — get any of them wrong
and a fresh set is generated. Every attempt to visit a blocked page is logged
per-site with a timestamp and count, viewable on the Settings page.

## Load it in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder (`ClaudeFocus`)

## Use it

- Click the toolbar icon → **Manage list & stats** to add sites to the
  blocklist (`youtube.com`, or a path fragment like `reddit.com/r/funny`)
  and to tune math difficulty (how many problems, number ranges, which
  operations).
- Click **Turn on** to start blocking. Turning on never requires a
  challenge — only turning off does.
- Visiting a blocked site redirects to a block screen showing how many
  times you've tried that site, with a button to attempt the unlock.
- The unlock page (`unlock.html`) presents math problems; all must be
  correct in one submission or new ones are generated.

## How it works

- `background.js` (MV3 service worker) watches navigation via
  `webNavigation.onBeforeNavigate`, checks the URL against your blocklist,
  logs the attempt, and redirects the tab to `blocked.html`.
- State (blocklist, on/off, difficulty, attempt log) lives in
  `chrome.storage.local`. The in-progress math answers live in
  `chrome.storage.session` and are checked in the background script, not
  trusted from the page.

## Known limitation

Like any self-blocking tool (Cold Turkey, StayFocusd, etc.), this can't
stop a technical user from disabling or removing the extension entirely
via `chrome://extensions`. It's designed to add friction against casual
impulse-browsing, not to be tamper-proof against yourself.
