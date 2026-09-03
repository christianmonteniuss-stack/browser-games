// ── ARENA QUESTIONS ──────────────────────────────────────────────────────────
// A plain list. Shape of each entry:
//
//   { q, options: [4 strings], correct: <index 0-3> }
//    │        │                       └── rättIndex
//    │        └── alternativ
//    └── fråga
//
// Add as many as you like — the mode shuffles them and cycles through,
// reshuffling once the list is exhausted. No game logic here.

module.exports = [
  { q: 'Vad heter Norges huvudstad?', options: ['Bergen', 'Oslo', 'Trondheim', 'Stavanger'], correct: 1 },
  { q: 'Hur många sidor har en kub?', options: ['4', '6', '8', '12'], correct: 1 },
  { q: 'Vilken är den största planeten i vårt solsystem?', options: ['Saturnus', 'Neptunus', 'Jupiter', 'Uranus'], correct: 2 },
  { q: 'Vad kallas vatten i fast form?', options: ['Ånga', 'Is', 'Dimma', 'Regn'], correct: 1 },
  { q: 'Hur många minuter går det på en timme?', options: ['30', '45', '60', '90'], correct: 2 },
  { q: 'Vilket språk talar man i Brasilien?', options: ['Spanska', 'Portugisiska', 'Franska', 'Italienska'], correct: 1 },
  { q: 'Vilken vik skiljer Sverige från Finland?', options: ['Skagerrak', 'Bottniska viken', 'Kattegatt', 'Öresund'], correct: 1 },
  { q: 'Hur många färger har den svenska flaggan?', options: ['1', '2', '3', '4'], correct: 1 },
  { q: 'Vad äter en herbivor?', options: ['Kött', 'Växter', 'Insekter', 'Fisk'], correct: 1 },
  { q: 'Vilken månad har 28 eller 29 dagar?', options: ['Januari', 'Februari', 'Mars', 'April'], correct: 1 },
  { q: 'Hur många kontinenter finns det?', options: ['5', '6', '7', '8'], correct: 2 },
  { q: 'Vad kallas processen där växter gör solljus till energi?', options: ['Andningen', 'Fotosyntesen', 'Förbränning', 'Kondensation'], correct: 1 },
  { q: 'Hur många ben har en insekt?', options: ['4', '6', '8', '10'], correct: 1 },
  { q: 'Vad är H2O mer känt som?', options: ['Salt', 'Socker', 'Vatten', 'Syre'], correct: 2 },
  { q: 'Vilket land är störst till ytan?', options: ['Kanada', 'Kina', 'USA', 'Ryssland'], correct: 3 },
  { q: 'Vad heter den första månaden på året?', options: ['December', 'Januari', 'Februari', 'Mars'], correct: 1 },
];
