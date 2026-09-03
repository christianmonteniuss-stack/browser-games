// ── SHARED CHARACTER RENDERING ───────────────────────────────────────────────
// The single place that knows how a character looks: an emoji on a coloured
// circle, OR an <img> when the character has an `imageUrl`. When real artwork
// arrives, add `imageUrl` to entries in server/characters.js — no other file
// needs to change.
//
// Used by both the host view and the player view.

(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  window.CharacterAvatar = {
    /**
     * @param {{ id, name, color, emoji, imageUrl? }} char
     * @param {{ size?: number }} [opts]  diameter in px (default 72)
     * @returns {string} HTML for a round avatar
     */
    html(char, opts) {
      char = char || {};
      const size = (opts && opts.size) || 72;
      const inner = char.imageUrl
        ? `<img class="char-img" src="${esc(char.imageUrl)}" alt="${esc(
            char.name || ''
          )}">`
        : `<span class="char-emoji">${esc(char.emoji || '?')}</span>`;

      return (
        `<span class="char-avatar" style="` +
        `--char-color:${esc(char.color || '#666')};` +
        `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px">` +
        inner +
        `</span>`
      );
    },
  };
})();
