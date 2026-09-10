// Quiz content. Each entry:
//   q:       the question text
//   options: 2–6 answer strings
//   correct: index into `options` of the right answer
//
// The quiz mode shuffles these and serves QUESTIONS_PER_ROUND of them per game,
// so add, remove and reorder freely — no code changes needed.
//
// Blandning: allmänbildning, popkultur och en rejäl dos fåniga dryckesfrågor.
// OBS: en handfull frågor snuddar vid dagsaktuella händelser (t.ex.
// Eurovision-vinnare) och kan behöva en uppfräschning då och då.

module.exports = [
  // ── Allmänbildning ──
  {
    q: 'Hur många kort finns i en vanlig kortlek utan jokrar?',
    options: ['48', '50', '52', '54'],
    correct: 2,
  },
  {
    q: 'Vad heter världens minsta självständiga stat?',
    options: ['Monaco', 'Nauru', 'Vatikanstaten', 'San Marino'],
    correct: 2,
  },
  {
    q: 'Vad kallas rädsla för spindlar?',
    options: ['Klaustrofobi', 'Araknofobi', 'Agorafobi', 'Akrofobi'],
    correct: 1,
  },
  {
    q: 'Vilken planet kallas "den röda planeten"?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturnus'],
    correct: 1,
  },
  {
    q: 'Hur många hjärtrum (kammare + förmak) har människans hjärta?',
    options: ['1', '2', '3', '4'],
    correct: 3,
  },
  {
    q: 'Vilket år hölls de första moderna olympiska spelen?',
    options: ['1886', '1896', '1900', '1912'],
    correct: 1,
  },
  {
    q: 'Hur många kontinenter brukar man säga att det finns?',
    options: ['5', '6', '7', '8'],
    correct: 2,
  },
  {
    q: 'Vad är det kemiska tecknet för vanligt koksalt?',
    options: ['NaCl', 'KCl', 'CaCO₃', 'H₂O'],
    correct: 0,
  },
  {
    q: 'Vilket datum firas Sveriges nationaldag?',
    options: ['1 maj', '6 juni', '24 juni', '13 december'],
    correct: 1,
  },
  {
    q: 'Hur många strängar har en standardviolin?',
    options: ['4', '5', '6', '7'],
    correct: 0,
  },
  {
    q: 'Vilket är det största landet i världen till ytan?',
    options: ['Kanada', 'Kina', 'USA', 'Ryssland'],
    correct: 3,
  },

  // ── Popkultur ──
  {
    q: 'Vilken artist gav ut albumet "Midnights" (2022)?',
    options: ['Beyoncé', 'Taylor Swift', 'Adele', 'Billie Eilish'],
    correct: 1,
  },
  {
    q: 'I vilken stad utspelar sig tv-serien "Vänner" ("Friends")?',
    options: ['Los Angeles', 'Chicago', 'New York', 'Boston'],
    correct: 2,
  },
  {
    q: 'Vad heter den fiktiva metallen från Wakanda i Marvel-filmerna?',
    options: ['Adamantium', 'Vibranium', 'Mithril', 'Kryptonit'],
    correct: 1,
  },
  {
    q: 'Vilken studio skapade tv-spelet "Minecraft"?',
    options: ['Mojang', 'Epic Games', 'Valve', 'Nintendo'],
    correct: 0,
  },
  {
    q: 'Vem regisserade filmen "Oppenheimer" (2023)?',
    options: ['Denis Villeneuve', 'Christopher Nolan', 'Steven Spielberg', 'Greta Gerwig'],
    correct: 1,
  },
  {
    q: 'Vilken svensk DJ ligger bakom hiten "Wake Me Up"?',
    options: ['Alesso', 'Avicii', 'Axwell', 'Eric Prydz'],
    correct: 1,
  },
  {
    q: 'Vilket land vann Eurovision Song Contest 2023?',
    options: ['Ukraina', 'Sverige', 'Finland', 'Storbritannien'],
    correct: 1,
  },
  {
    q: 'Vad heter Homer Simpsons chef i "The Simpsons"?',
    options: ['Ned Flanders', 'Mr Burns', 'Moe Szyslak', 'Barney'],
    correct: 1,
  },
  {
    q: 'Vilken streamingtjänst producerade "Stranger Things"?',
    options: ['HBO', 'Netflix', 'Disney+', 'Viaplay'],
    correct: 1,
  },
  {
    q: 'Vilket band framförde originalet "Bohemian Rhapsody"?',
    options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'],
    correct: 1,
  },
  {
    q: 'Vem brukar kallas "the King of Pop"?',
    options: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Freddie Mercury'],
    correct: 1,
  },

  // ── Fåniga & dryck ──
  {
    q: 'Hur många centiliter är en klassisk restaurangshot i Sverige?',
    options: ['1 cl', '2 cl', '4 cl', '8 cl'],
    correct: 2,
  },
  {
    q: 'Vad heter en öl blandad med läsk/citronsaft – på klassisk tyska?',
    options: ['Radler', 'Snakebite', 'Michelada', 'Shandy'],
    correct: 0,
  },
  {
    q: 'Vad heter Sveriges statliga butik för starkare alkohol?',
    options: ['ICA', 'Systembolaget', 'Apoteket', 'Pressbyrån'],
    correct: 1,
  },
  {
    q: 'Vilken frukt hör hemma i en Piña Colada?',
    options: ['Mango', 'Ananas', 'Passionsfrukt', 'Banan'],
    correct: 1,
  },
  {
    q: 'Hur säger man "skål" i Tyskland?',
    options: ['Salud', 'Prost', 'Kanpai', 'Cin cin'],
    correct: 1,
  },
  {
    q: 'Vad kallas en liten snaps som ofta tas "på stående fot"?',
    options: ['Nubbe', 'Grogg', 'Sejdel', 'Longdrink'],
    correct: 0,
  },
  {
    q: 'Vilken dryck förknippas mest med den tyska Oktoberfest?',
    options: ['Vin', 'Öl', 'Cider', 'Whisky'],
    correct: 1,
  },
  {
    q: 'Vilken promillegräns gäller för rattfylleri i Sverige?',
    options: ['0,2 ‰', '0,5 ‰', '0,8 ‰', '1,0 ‰'],
    correct: 0,
  },
  {
    q: '"Bakis" är slang för vad?',
    options: ['Hungrig', 'Bakfull', 'Trött efter jobbet', 'Förkyld'],
    correct: 1,
  },
  {
    q: 'Vad blandar man i en "Cuba Libre"?',
    options: ['Rom, cola och lime', 'Vodka och apelsin', 'Gin och tonic', 'Whisky och vatten'],
    correct: 0,
  },
  {
    q: 'Hur mycket rymmer en svensk "helflaska" sprit?',
    options: ['0,5 liter', '0,7 liter', '1 liter', '1,5 liter'],
    correct: 1,
  },
  {
    q: 'Vilken ört ger "bäska droppar" och absint sin karaktäristiska smak?',
    options: ['Malört', 'Lakrits', 'Kanel', 'Kummin'],
    correct: 0,
  },
  {
    q: 'Vad kallas den alkoholfria utmaningen i januari?',
    options: ['Torr januari ("Dry January")', 'Blå måndag', 'Vitvecka', 'Fettisdagen'],
    correct: 0,
  },
];
