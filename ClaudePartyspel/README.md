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

Kör du [Bun](https://bun.sh/) i stället funkar `bun server/index.js` lika bra
(beroendena är redan installerade i repo:t).

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
3. Skriv namn → välj karaktär → du dyker upp i spelarlistan på host-skärmen.
4. Host trycker **"Starta Arena"** och sedan **"Nästa runda"** för varje runda.
   Rundan är en av: en spelare svarar på en fråga, "Time to Choose"
   (alla röstar på vem påståendet passar), eller ett reaktionstest. Ibland
   dyker BOOZE MOOSE upp och multiplicerar rundans poäng. Host avslutar med
   **"Avsluta & kora vinnare"** — då visas slutställningen.

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
│   ├── index.js          Startpunkt: HTTP + statiska filer + /api/modes + /api/characters + /qr + WebSocket
│   ├── protocol.js       Alla meddelandetyper på tråden (+ säker send())
│   ├── net.js            Hittar datorns lokala IP-adress
│   ├── staticServer.js   Minimal filserver för public/
│   ├── characters.js     Fasta karaktärslistan (id, namn, färg, emoji, valfri imageUrl) — bara data
│   ├── lobby.js          Lobby + Player: vilka är med, namn, poäng, vald karaktär
│   ├── gameManager.js    KÄRNAN: routar meddelanden, kör ETT spelläge, bygger `ctx`
│   └── modes/
│       ├── index.js      Registret över alla spellägen  ← lägg till din nya lek här
│       └── arena/        (enda spelläget)
│           ├── index.js       Kärnan: Rummet, rundvärde, älg, resultat, slutskärm, golf-tavla
│           ├── config.js      Tider, MIN_PLAYERS, ROUND_VALUE_START, ROUND_TYPE_WEIGHTS, MOOSE_* (tunables)
│           ├── util.js        shuffled / pickRandom
│           ├── questions.js    Frågerundans frågor (bara data)
│           ├── statements.js   "Time to Choose"-påståenden (bara data, 18+)
│           └── rounds/
│               ├── index.js    Rundtypsregister + viktad slump
│               ├── quiz.js     Rundtyp: en spelare svarar på en fråga
│               ├── choose.js   Rundtyp: Time to Choose
│               └── react.js    Rundtyp: reaktionstest
└── public/
    ├── assets/sounds/select.wav  Platshållar-ljud när en spelare lottas (byt ut fritt)
    ├── assets/sounds/moose.wav   Platshållar-ljud för älgen (byt ut fritt)
    ├── assets/music/lobby.mp3    Loopas på host-skärmen i lobbyn (byt ut fritt)
    ├── shared/events.js     Webbläsarkopia av meddelandetyperna (spegel av protocol.js)
    ├── shared/character.js  Enda stället som ritar en karaktär (emoji/färg-cirkel, eller bild om imageUrl finns)
    ├── shared/character.css Stilar för karaktärscirkeln + valrutnätet
    ├── shared/sfx.js        Ljudmotor (WebAudio-synt, inga ljudfiler): win/lose/tick/signal + say()
    ├── shared/confetti.js   Canvas-konfetti (window.Confetti.burst) på vinst/slut
    ├── host/
    │   ├── index.html    Host-skärmen
    │   ├── host.css
    │   ├── host.js       Host-kärnan (lobby-UI, lobbymusik, karaktärsöversikt, laddar renderare + CSS, WebSocket)
    │   └── modes/        arena.js + arena.css (host-renderare)
    └── player/
        ├── index.html    Spelar-vyn (mobil)
        ├── player.css
        ├── player.js     Spelar-kärnan (namn/join → karaktärsval → lobby, reconnect, WebSocket)
        └── modes/        arena.js + arena.css (spelar-renderare)
```

### Karaktärer

Karaktärsvalet är en **kärn-funktion i lobbyn**, inte ett spelläge. Flödet på
mobilen är: skriv namn → **välj en ledig karaktär** → in i lobbyn. Man kommer
inte vidare förrän en ledig karaktär är vald.

* All data ligger i `server/characters.js` (`{ id, name, color, emoji, imageUrl? }`).
  Servern skickar listan som JSON på `GET /api/characters`.
* Servern är auktoritet: `Lobby.chooseCharacter()` avvisar en redan tagen
  karaktär (`error: 'character_taken'`). Varje lyckat/misslyckat val följs av
  en ny `lobby_state`-broadcast, så alla skärmar uppdaterar upptaget/ledigt i
  realtid.
* En karaktär hålls av spelaren så länge den finns i lobbyn (överlever
  reconnect). Startas servern om nollställs allt.
* **Kicka spelare:** varje spelare i host-listan har en `×`-knapp (bara i
  lobbyn). Den skickar `host_action` `{ action: 'kick', data: { playerId } }`
  → `GameManager._kickPlayer()` tar bort spelaren, frigör karaktären och
  skickar `error: 'kicked'` till mobilen (som då hamnar på namn-skärmen igen).
* **Byta till bilder senare:** sätt `imageUrl` på en karaktär i
  `characters.js`. `public/shared/character.js` väljer då `<img>` istället för
  emoji/färg-cirkeln — ingen annan kod behöver ändras.
* Meddelande klient→server: `choose_character` `{ characterId }`.

### Så hänger det ihop

```
 Mobil (player.js) ──WebSocket──┐
 Mobil (player.js) ──WebSocket──┤
                                ├──►  server/index.js  ──►  GameManager
 Host  (host.js)   ──WebSocket──┘                             │
                                                              ▼
                                                     aktivt spelläge (Arena)
                                                     pratar bara via `ctx`
```

* **GameManager** äger lobbyn, socket-routing och kör som mest **ett** spelläge
  i taget. Den vet ingenting om Arena specifikt — arkitekturen tål fler lägen,
  men just nu finns bara Arena i registret.
* Ett **spelläge** är en modul som får ett `ctx`-objekt — det är hela ytan den
  får röra. Den hanterar sin egen interna state (aktuell fråga, vem har svarat)
  och bestämmer vad som ritas.
* **host.js / player.js** är "dumma" skal: de sköter join/lobby/anslutning och
  lämnar över själva spelskärmen till lägets renderare.

### Meddelandeprotokoll

Varje WebSocket-meddelande är JSON: `{ type, payload }`. Typerna finns i
`server/protocol.js` (och speglade i `public/shared/events.js`).

Klient → server: `join`, `rejoin`, `choose_character`, `player_action`,
`host_hello`, `host_start_mode`, `host_action`
Server → klient: `joined`, `error`, `lobby_state`, `mode_started`,
`mode_state`, `mode_ended`

`lobby_state.players[]` innehåller `{ id, name, score, connected, characterId }`.

`mode_state` bär `{ modeId, view, data }` — lägets renderare på host/mobil
väljer delskärm utifrån `view` och ritar `data`.

---

## Arena — huvudloopen

`server/modes/arena/` är kärnspelsloopen. Host startar den som ett vanligt
spelläge ("Starta Arena") och styr den med **en enda knapp: "Nästa runda"**.

**Rummet** (host-skärmen mellan rundor): alla spelares karaktärer i rad, med
poäng. Här sitter "Nästa runda"- och "Avsluta"-knapparna.

> **Rundvärde (straffpoäng som står på spel), per rundnummer `n`:**
> rundor 1–5 → **3**, rundor 6–15 → **4**, sedan **+1 var tionde runda**
> (16–25 → 5, 26–35 → 6, …). Se `_roundValueFor()` i `arena/index.js`,
> startvärdet i `ROUND_VALUE_START`. **BOOZE MOOSE** multiplicerar värdet
> **resten av spelet** — ×2 efter första besöket, ×3 efter andra, … (den
> ökar bara, nollställs aldrig förrän nästa spel).
>
> **Poängen nollställs när spelet avslutas** (åter till lobbyn) — sköts
> centralt i `GameManager._endActiveMode()`.
>
> **Slutskärm:** host trycker "Avsluta & kora vinnare" i Rummet → fas
> `'final'` (`_toFinal` / `_finalData`) visar vinnaren (lägst poäng) och
> förloraren (flest poäng) på alla skärmar, plus hela golf-tavlan. Host
> trycker "Tillbaka till lobbyn" för att gå till lobbyn.

När host trycker "Nästa runda" slumpar servern **vilken rundtyp** som körs,
enligt vikterna i `config.ROUND_TYPE_WEIGHTS`. Rundtyperna ligger var för sig
i `server/modes/arena/rounds/` — arena-kärnan äger rundvärde, älg, resultat-
timing, slutskärm och golf-tavlan; en rundtyp ser bara `rc`-objektet (se
`_rc()` i `server/modes/arena/index.js`).

Alla tunables (svars-/pick-/choose-/resultat-tider, `MIN_PLAYERS`,
`ROUND_VALUE_START`, rundtypsvikter, älg-konstanter) ligger i
`server/modes/arena/config.js`.

### Rundtyp: Fråga (`rounds/quiz.js`)

1. Servern lottar EN ansluten karaktär. Dess avatar blinkar i Rummet och ett
   ljud spelas (host). Ljudet: `public/assets/sounds/select.wav` — byt filen
   (behåll namnet) eller ändra `SOUND_URL` överst i `public/host/modes/arena.js`.
2. Den utvalda spelarens mobil visar en fråga med 4 alternativ. Övriga mobiler
   visar "X svarar…". Host visar en nedräkning.
3. **Rätt svar:** spelarens mobil visar ett **"bounce room"** — alla figurer
   (den som svarade **inräknad**) studsar runt utan namn. Man klickar på en
   figur; den får rundvärdet i straffpoäng. Eftersom den egna figuren är med
   går det att råka peka ut sig själv. Servern skickar `candidates` **utan
   namn**, i slumpad ordning (`_pickCandidates`), och `award` godtar även
   den egna spelaren. Den utpekade ser **på sin egen mobil** tydligt hur
   många poäng (`scoredId` + `you-scored`-bannern). Alla skärmar: "Let's go,
   X!". (Klickar ingen inom `PICK_SECONDS` lottas en **annan** spelare.)
4. **Fel svar (eller tiden ut):** den som svarade får själv rundvärdet i
   straffpoäng och ser det på sin mobil. Alla skärmar: "You suck, X!".

Frågor: `server/modes/arena/questions.js`, `{ q, options: [4], correct }`.
Listan shufflas och cyklas. Mest riktig allmänbildning (naturvetenskap,
historia, geografi, kultur, sport) med en kortare svans fåniga
dryckesfrågor sist. Ett par svar (t.ex. Sveriges regerande kung) tål att
ses över med åren.

### Rundtyp: Time to Choose (`rounds/choose.js`)

1. Host **och** alla mobiler visar "Time to Choose" + ett påstående (t.ex.
   "Vem är mest sannolik att somna först ikväll?"). Host visar en nedräkning
   och hur många som röstat.
2. Varje spelare röstar på sin mobil på **vilken ansluten karaktär som helst,
   sig själv inkluderad** (självval alltid tillåtet). En röst per spelare,
   sista räknas.
3. När alla röstat, eller `CHOOSE_SECONDS` gått: varje karaktär får
   **röster × rundvärde × ev. älg-multiplikator** poäng.
4. Host-resultatet listar alla karaktärer med röstantal och poäng de fick.

Påståenden: `server/modes/arena/statements.js`, `{ text }` — samma mönster
som frågefilen. Lägg bara till fler.

### Rundtyp: Reaktionstest (`rounds/react.js`)

1. Host visar ett stort "C" som **rör sig** medan bakgrunden strobar i
   partyfärger. En **metronom** (WebAudio, `SFX.startLoop` i
   `public/shared/sfx.js`) tickar i takt med att C:et pulsar — tempo och
   tonhöjd stiger ju längre väntan blir, så det byggs upp en stress. Alla
   mobiler visar en stor knapp + "Vänta…" (knappen är inaktiv och pulsar).
2. Efter en slumpad fördröjning i `[REACT_DELAY_MIN, REACT_DELAY_MAX]` sekunder
   **fryser C:et** — det är signalen. Metronomen tystnar, ett kort "GO"-ljud
   spelas och mobilerna byter till "TRYCK NU!" (+ vibration) och knappen
   aktiveras. Servern startar tidtagning **från när den skickade signalen**
   (mätt serverside, `Date.now() - signalAt`).
3. Servern samlar in reaktionstiderna och sorterar snabbast → långsammast.
   Trycker man inte inom `REACT_MAX_SECONDS` efter signalen räknas man som
   sist. Tryck **före** signalen ignoreras (knappen är inaktiv i klienten).
4. **Poäng:** rang `r` (0-indexerad) ger `r × rundvärde × ev. älg-multiplikator`
   — snabbast (rang 0) får 0, näst snabbast rundvärdet × 1, osv.
5. Host-resultatet listar alla, snabbast → långsammast, med tider och poäng.

Inget innehåll att fylla på (helt slumpstyrt); tunables i `config.js`:
`REACT_DELAY_MIN` / `REACT_DELAY_MAX` / `REACT_MAX_SECONDS`.

### Vilken rundtyp körs?

`rounds.pickRoundType(lastId)` (i `rounds/index.js`) gör ett viktat slumpval
enligt `config.ROUND_TYPE_WEIGHTS` (default `quiz 0.52 / choose 0.28 /
react 0.20`) — **men** `choose` och `react` körs aldrig två gånger i rad
(quiz får upprepas). I praktiken: frågor dominerar, "välj ut någon" ~var
4:e runda, reaktionstest ~var 5:e.

**Innehåll upprepas inte:** `quiz.js` och `choose.js` delar ut rakt igenom
en blandad kortlek som lever kvar hela serverstarten och blandas om först
när den tar slut — så samma fråga/påstående kan inte komma igen (inte ens
mellan spel) förrän hela banken använts.

**Lägg till en ny rundtyp:** skapa `server/modes/arena/rounds/<id>.js` (samma
form som quiz/choose — `id`, `start`, `onPlayerMessage`, `syncPlayer`,
`syncHost`, valfri `reset`/`onPlayerLeave`), lägg in den i `ROUND_TYPES` i
`rounds/index.js`, ge den en vikt i `config.ROUND_TYPE_WEIGHTS`, och lägg till
`view`-grenar i `public/{host,player}/modes/arena.js`.

### Älgen (slumphändelse)

Ett tillägg ovanpå rundlogiken, inte en omskrivning. `onHostMessage` kör
`_maybeMoose(() => this._startRound())` — älgen slås fram **innan** rundan.

* **Chans:** `MOOSE_CHANCE` per runda (default `0.15`). Konstant i
  `server/modes/arena/config.js`.
* **Om älgen dyker upp:** fas `'moose'`, en `mode_state`-broadcast med
  `view: 'moose'` → stor "BOOOOSE MOOOOSE"-overlay på host (`🫎`, skakning,
  **röda blinkljus**, `moose.wav` + flera överlappande synt-stampar, och
  talsyntesen "boooooze moooose") och en kortare variant på mobilerna.
  Efter `MOOSE_INTRO_SECONDS` startar själva rundan.
* **Räknare:** `mooseVisits` (per omgång, på servern). **Multiplikator** =
  `MOOSE_BASE_MULTIPLIER + (mooseVisits - 1)` → 2× efter första besöket, 3×
  efter andra, 4× efter tredje …
* **Effekt (PERSISTENT):** multiplikatorn ligger kvar **resten av spelet** —
  `_points() = enheter × roundValue × mooseMultiplier` på *varje* runda, inte
  bara älg-rundan. `_toRoom()` nollställer bara "han är här"-flaggan
  (`mooseActive`), inte `mooseMultiplier`.
* **Intensitet:** `intensity = mooseVisits` skickas till klienten som skruvar
  upp skakning, storlek, blinkljusens takt/styrka och antal ljudstampar för
  varje nytt besök.
* `mode_state` `view: 'result'` bär även `pointsAwarded`, `scoredId` (spelaren
  som fick straffpoängen — får en tydlig banner på sin mobil) och
  `moose: { active, multiplier, visits }`.

**Poäng = golf:** lägst total vinner (guld + "10 stödbög-klunkar"); flest
poäng förlorar ("10 utdelningsklunkar"). Att få poäng är dåligt. Leaderboarden
(`_standings()` i arena-läget) sorteras stigande, och `.leader` i toppen
markeras grönt med ★.

**Per-läge CSS:** eftersom arena-läget har `css: true` i registret laddar
host/mobil även `/(host|player)/modes/arena.css` automatiskt.

**Reconnect:** `onHostJoin(ctx)` ritar om host-skärmen om host laddas om mitt
i en runda; `onPlayerJoin(ctx, player)` re-synkar en mobil.

**Medan ett spel pågår** lämnar mobilerna lobbyn helt: `render()` i
`player.js` tvingar `screen-game` så snart `state.currentMode` är satt (det
sätts även från `lobby_state.activeMode`, så en mobil som ansluter mitt i ett
spel hamnar direkt på spelskärmen). Karaktärsval är avstängt server-side
under spel (`_onChooseCharacter` svarar `error: 'game_in_progress'`) — den
som joinar mitt i tittar på tills omgången är slut.

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
    onHostJoin(ctx) {},                // rita om host-skärmen efter host-reconnect
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
kort, ord) i en egen `*.js`-datafil bredvid, som `arena/questions.js`.

### 2. Registrera läget — `server/modes/index.js`

```js
const createMyMode = require('./mymode');
// ...
const REGISTRY = [
  { id: 'arena',  name: 'Arena',   minPlayers: 2, css: true, factory: createArenaMode },
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
* Bara ett spelläge (Arena). Arkitekturen tål fler — se "Lägga till en lek".
* Ljud kräver att host klickat minst en gång (webbläsarnas autoplay-spärr).
* `statements.js` är en 18+-lista — byt tillbaka för blandat sällskap.
