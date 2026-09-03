// Quiz content. Each entry:
//   q:       the question text
//   options: 2–6 answer strings
//   correct: index into `options` of the right answer
//
// The quiz mode uses the first QUESTIONS_PER_ROUND of these, in order.
// Add, remove, reorder freely — no code changes needed.

module.exports = [
  {
    q: 'Vilken planet ligger närmast solen?',
    options: ['Venus', 'Merkurius', 'Mars', 'Jupiter'],
    correct: 1,
  },
  {
    q: 'Hur många ben har en spindel?',
    options: ['6', '8', '10', '12'],
    correct: 1,
  },
  {
    q: 'Vilket år föll Berlinmuren?',
    options: ['1987', '1989', '1991', '1993'],
    correct: 1,
  },
  {
    q: 'Vilket grundämne har den kemiska beteckningen "Au"?',
    options: ['Silver', 'Aluminium', 'Guld', 'Koppar'],
    correct: 2,
  },
  {
    q: 'Hur många strängar har en vanlig gitarr?',
    options: ['4', '5', '6', '7'],
    correct: 2,
  },
  {
    q: 'Vilket är världens största hav?',
    options: ['Atlanten', 'Indiska oceanen', 'Norra ishavet', 'Stilla havet'],
    correct: 3,
  },
  {
    q: 'Hur många hjärtan har en bläckfisk?',
    options: ['1', '2', '3', '4'],
    correct: 2,
  },
  {
    q: 'Vilket land vann fotbolls-VM 2018?',
    options: ['Tyskland', 'Frankrike', 'Kroatien', 'Brasilien'],
    correct: 1,
  },
  {
    q: 'Vad heter Sveriges högsta berg?',
    options: ['Kebnekaise', 'Sarektjåkkå', 'Åreskutan', 'Galdhøpiggen'],
    correct: 0,
  },
  {
    q: 'Hur många färger har en regnbåge traditionellt?',
    options: ['5', '6', '7', '8'],
    correct: 2,
  },
];
