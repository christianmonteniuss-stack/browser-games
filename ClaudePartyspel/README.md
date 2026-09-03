# ClaudePartyspel

Ett lokalt partyspel för samma rum. Din dator kör en liten server som håller
en spel-lobby. Kompisarna öppnar en webbadress i mobilen — ingen app behövs.
Alla enheter sitter på samma WiFi; ingen internetuppkoppling eller molnserver
krävs för att spela.

En **host-skärm** (din laptop/TV) visar QR-kod, spelarlista och spelflödet.
Varje **spelar-mobil** skriver in ett namn och interagerar med det som händer.

---

## Kom igång

Kräver [Node.js](https://nodejs.org/) 16 eller senare.

```bash
cd ClaudePartyspel
npm install      # en gång, kräver internet just den gången (hämtar 'ws' + 'qrcode')
npm start
```

Terminalen skriver ut något i stil med:

```
  Host-skärm (denna dator):  http://localhost:3000/host
  Spelare joinar här:        http://192.168.1.42:3000/
  <QR-kod>
```

1. Öppna **host-adressen** (`/host`) i webbläsaren på datorn som är kopplad
   till den stora skärmen.
2. Alla kompisar skannar QR-koden (eller skriver in `http://<din-ip>:3000/`).
   De måste vara på **samma WiFi** som datorn.
3. Skriv namn → du dyker upp i spelarlistan på host-skärmen.
4. Host trycker **"Starta Quiz"**. Frågan visas samtidigt på storskärmen och
   alla mobiler. Alla svarar på sin mobil, servern räknar poäng, och en
   resultattavla visas efter varje fråga.

Byt port med `PORT=4000 npm start` om 3000 är upptagen.

### Hitta din lokala IP manuellt

Servern gissar oftast rätt, men om länken inte funkar:

| OS | Kommando | Leta efter |
|---|---|---|
| Windows | `ipconfig` | `IPv4-adress` under din WiFi-adapter (t.ex. `192.168.x.x`) |
| macOS | `ipconfig getifaddr en0` | adressen som skrivs ut |
| Linux | `hostname -I` | första `192.168.x.x` / `10.x.x.x` |

Sätt sedan ihop `http://DEN.HÄR.IP:3000/` och dela med kompisarna.

### Brandvägg

Första gången kan Windows/macOS fråga om Node får ta emot inkommande
anslutningar — säg **ja** (privat nätverk), annars når mobilerna inte servern.

---

## Projektstruktur

```
ClaudePartyspel/
├── server/
│   ├── index.js          Startpunkt: HTTP + statiska filer + /api/modes + /qr + WebSocket
│   ├── protocol.js       Alla meddelandetyper på tråden (+ säker send())
│   ├── net.js            Hittar datorns lokala IP-adress
│   ├── staticServer.js   Minimal filserver för public/
│   ├── lobby.js          Lobby + Player: vilka är med, namn, poäng
│   ├── gameManager.js    KÄRNAN: routar meddelanden, kör ETT spelläge, bygger `ctx`
│   └── modes/
│       ├── index.js      Registret över alla spellägen  ← lägg till din nya lek här
│       └── quiz/
│           ├── index.js       Quiz-lägets logik (referensimplementation)
│           └── questions.js    Quiz-innehåll (bara data)
└── public/
    ├── shared/events.js  Webbläsarkopia av meddelandetyperna (spegel av protocol.js)
    ├── host/
    │   ├── index.html    Host-skärmen
    │   ├── host.css
    │   ├── host.js       Host-kärnan (lobby-UI, laddar renderare, WebSocket)
    │   └── modes/quiz.js Host-renderare för quiz
    └── player/
        ├── index.html    Spelar-vyn (mobil)
        ├── player.css
        ├── player.js     Spelar-kärnan (namn/join, reconnect, WebSocket)
        └── modes/quiz.js Spelar-renderare för quiz
```

### Så hänger det ihop

```
 Mobil (player.js) ──WebSocket──┐
 Mobil (player.js) ──WebSocket──┤
                                ├──►  server/index.js  ──►  GameManager
 Host  (host.js)   ──WebSocket──┘                             │
                                                              ▼
                                                     aktivt spelläge (t.ex. quiz)
                                                     pratar bara via `ctx`
```

* **GameManager** äger lobbyn, socket-routing och kör som mest **ett** spelläge
  i taget. Den vet ingenting om quiz specifikt.
* Ett **spelläge** är en modul som får ett `ctx`-objekt — det är hela ytan den
  får röra. Den hanterar sin egen interna state (aktuell fråga, vem har svarat)
  och bestämmer vad som ritas.
* **host.js / player.js** är "dumma" skal: de sköter join/lobby/anslutning och
  lämnar över själva spelskärmen till lägets renderare.

### Meddelandeprotokoll

Varje WebSocket-meddelande är JSON: `{ type, payload }`. Typerna finns i
`server/protocol.js` (och speglade i `public/shared/events.js`).

Klient → server: `join`, `rejoin`, `player_action`, `host_hello`,
`host_start_mode`, `host_action`
Server → klient: `joined`, `error`, `lobby_state`, `mode_started`,
`mode_state`, `mode_ended`

`mode_state` bär `{ modeId, view, data }` — lägets renderare på host/mobil
väljer delskärm utifrån `view` och ritar `data`.

---

## Lägg till ett nytt spelmoment

Ett spelläge är tre filer + en rad i registret. Grundlogiken rörs aldrig.

### 1. Serverlogik — `server/modes/<id>/index.js`

Exportera en **factory** som returnerar ett färskt lägesobjekt:

```js
function createMyMode() {
  return {
    id: 'mymode',
    name: 'Min lek',
    minPlayers: 2,

    // ── obligatoriskt ──
    onStart(ctx) {
      this.ctx = ctx;
      // nollställ ev. poäng, bygg intern state, skicka första skärmen
      ctx.broadcast('mode_state', { modeId: this.id, view: 'intro', data: {} });
    },

    // ── valfritt (utelämna det du inte behöver) ──
    onHostMessage(ctx, msg) {},        // { action, data } från host-knappar
    onPlayerMessage(ctx, player, msg) {}, // { modeId, action, data } från en mobil
    onPlayerJoin(ctx, player) {},      // ge en (åter)ansluten spelare rätt skärm
    onPlayerLeave(ctx, player) {},     // en spelare tappade anslutningen
    onEnd(ctx) {},                     // städning efter ctx.endMode()
  };
}
module.exports = createMyMode;
```

**`ctx` — hela gränssnittet mot kärnan** (se `server/gameManager.js`):

| Metod | Vad den gör |
|---|---|
| `ctx.lobby` | Lobby-instansen (läs `players`, m.m.) |
| `ctx.players()` | Array med anslutna spelare |
| `ctx.standings()` | `[{ id, name, score, connected }]`, högst poäng först |
| `ctx.addScore(playerId, points)` | Ändra poäng i den centrala leaderboarden |
| `ctx.resetScores()` | Nollställ alla poäng |
| `ctx.toHost(type, payload)` | Skicka till alla host-skärmar |
| `ctx.toPlayer(playerId, type, payload)` | Skicka till en spelare |
| `ctx.toAllPlayers(type, payload)` | Skicka till alla spelare |
| `ctx.broadcast(type, payload)` | Skicka till host + alla spelare |
| `ctx.endMode()` | Avsluta lägets — tillbaka till lobbyn |

`type` är i praktiken alltid `'mode_state'`. Lägg gärna spelinnehåll (frågor,
kort, ord) i en egen `*.js`-datafil bredvid, som `quiz/questions.js`.

### 2. Registrera läget — `server/modes/index.js`

```js
const createMyMode = require('./mymode');
// ...
const REGISTRY = [
  { id: 'quiz',   name: 'Quiz',    minPlayers: 1, factory: createQuizMode },
  { id: 'mymode', name: 'Min lek', minPlayers: 2, factory: createMyMode },
];
```

### 3. Renderare i webbläsaren

Host och spelar-sidorna hämtar listan från `/api/modes` och laddar
automatiskt `/(host|player)/modes/<id>.js` — **ingen HTML behöver ändras**.

`public/host/modes/mymode.js`:

```js
(function () {
  window.HostModes = window.HostModes || {};
  window.HostModes.mymode = {
    render(msg, api) {
      // msg = { modeId, view, data }
      // api = { root, clear(), send(action, data) }  -> send() ger host_action
      api.root.innerHTML = `<h2>${window.cpEscapeHtml(msg.data.title || '')}</h2>`;
    },
  };
})();
```

`public/player/modes/mymode.js`:

```js
(function () {
  window.PartyModes = window.PartyModes || {};
  window.PartyModes.mymode = {
    render(msg, api) {
      // api = { root, clear(), send(action, data), me() }  -> send() ger player_action
      const b = document.createElement('button');
      b.className = 'big-btn';
      b.textContent = 'Tryck!';
      b.onclick = () => api.send('press', { at: Date.now() });
      api.root.replaceChildren(b);
    },
  };
})();
```

Starta om servern, ladda om sidorna, och "Starta Min lek" dyker upp på
host-skärmen.

### Checklista

- [ ] `server/modes/<id>/index.js` med factory + `onStart`
- [ ] rad i `server/modes/index.js` `REGISTRY`
- [ ] `public/host/modes/<id>.js` (`window.HostModes.<id>`)
- [ ] `public/player/modes/<id>.js` (`window.PartyModes.<id>`)
- [ ] starta om servern, ladda om host + mobil

---

## Kända begränsningar i v1

* All state lever i minnet. Startar du om servern nollställs lobbyn och
  mobilerna får skriva in namn igen.
* Ett spelläge åt gången.
* Ingen tidsgräns per fråga i quizet (host klickar "Visa svar" / "Nästa
  fråga"). Auto-avslöjar när alla anslutna har svarat.
* Poäng är platt 100 p för rätt svar — snabbhetsbonus är en enkel utökning i
  `server/modes/quiz/index.js` (`_reveal`).
