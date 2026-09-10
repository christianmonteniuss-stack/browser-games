// Quiz content. Each entry:
//   q:       the question text
//   options: 2–6 answer strings
//   correct: index into `options` of the right answer
//
// The quiz mode shuffles these and serves QUESTIONS_PER_ROUND of them per game,
// so add, remove and reorder freely — no code changes needed.
//
// Mestadels riktig allmänbildning (naturvetenskap, historia, geografi, kultur)
// med en mindre svans fåniga dryckesfrågor på slutet.

module.exports = [
  // ── Naturvetenskap & kropp ──
  {
    q: 'Vem upptäckte penicillinet?',
    options: ['Louis Pasteur', 'Alexander Fleming', 'Robert Koch', 'Marie Curie'],
    correct: 1,
  },
  {
    q: 'Hur många ben har en vuxen människas kropp?',
    options: ['186', '198', '206', '214'],
    correct: 2,
  },
  {
    q: 'Vem utvecklade relativitetsteorin?',
    options: ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Galileo Galilei'],
    correct: 2,
  },
  {
    q: 'Hur många kromosomer finns i en normal mänsklig cell?',
    options: ['23', '44', '46', '48'],
    correct: 2,
  },
  {
    q: 'Vad är den kemiska formeln för vatten?',
    options: ['CO₂', 'H₂O', 'O₂', 'NaCl'],
    correct: 1,
  },
  {
    q: 'Vilket organ pumpar blod genom kroppen?',
    options: ['Lungorna', 'Levern', 'Hjärtat', 'Njurarna'],
    correct: 2,
  },
  {
    q: 'Vem anses vara den moderna evolutionsteorins grundare?',
    options: ['Gregor Mendel', 'Charles Darwin', 'Carl von Linné', 'Jean-Baptiste Lamarck'],
    correct: 1,
  },
  {
    q: 'Vilket är människokroppens största organ?',
    options: ['Levern', 'Hjärnan', 'Huden', 'Lungorna'],
    correct: 2,
  },
  {
    q: 'Vilken är jordens närmaste granneplanet?',
    options: ['Mars', 'Venus', 'Merkurius', 'Jupiter'],
    correct: 1,
  },
  {
    q: 'Hur många planeter finns i vårt solsystem?',
    options: ['7', '8', '9', '10'],
    correct: 1,
  },
  {
    q: 'Vilken kemisk symbol har guld?',
    options: ['Ag', 'Au', 'Gu', 'Go'],
    correct: 1,
  },
  {
    q: 'Hur många tänder har en vuxen människa normalt?',
    options: ['28', '30', '32', '36'],
    correct: 2,
  },
  {
    q: 'Ungefär hur många liter blod har en vuxen människa?',
    options: ['cirka 3', 'cirka 5', 'cirka 8', 'cirka 12'],
    correct: 1,
  },
  {
    q: 'Hur många tår har en vanlig katt totalt?',
    options: ['16', '18', '20', '22'],
    correct: 1,
  },
  {
    q: 'Hur många kotor har människans ryggrad (inräknat de sammanväxta)?',
    options: ['24', '29', '33', '40'],
    correct: 2,
  },
  {
    q: 'Hur många hjärtkammare har ett däggdjurshjärta?',
    options: ['1', '2', '3', '4'],
    correct: 3,
  },
  {
    q: 'Hur gammal blir en jättesköldpadda i genomsnitt?',
    options: ['cirka 30 år', 'cirka 60 år', 'över 100 år', 'över 400 år'],
    correct: 2,
  },
  {
    q: 'Hur många revben har människokroppen?',
    options: ['20', '22', '24', '26'],
    correct: 2,
  },
  {
    q: 'Hur många ben har en spindel?',
    options: ['6', '8', '10', '12'],
    correct: 1,
  },
  {
    q: 'Vilket år lanserades den första iPhonen?',
    options: ['2005', '2007', '2009', '2010'],
    correct: 1,
  },
  {
    q: 'Vilket organ producerar insulin?',
    options: ['Levern', 'Bukspottkörteln', 'Mjälten', 'Njuren'],
    correct: 1,
  },

  // ── Historia ──
  {
    q: 'Vilket år startade franska revolutionen?',
    options: ['1776', '1789', '1799', '1804'],
    correct: 1,
  },
  {
    q: 'Vilket år föll Berlinmuren?',
    options: ['1987', '1989', '1991', '1993'],
    correct: 1,
  },
  {
    q: 'Vem grundade det mongoliska riket?',
    options: ['Kublai Khan', 'Djingis Khan', 'Attila', 'Tamerlan'],
    correct: 1,
  },
  {
    q: 'Vem skrev dramat "Faust"?',
    options: ['Friedrich Schiller', 'J.W. von Goethe', 'Heinrich Heine', 'Thomas Mann'],
    correct: 1,
  },
  {
    q: 'Vilket år bröt första världskriget ut?',
    options: ['1912', '1914', '1916', '1918'],
    correct: 1,
  },
  {
    q: 'Vilket folk byggde pyramiderna i Giza?',
    options: ['Nubierna', 'De forntida egyptierna', 'Assyrierna', 'Fenicierna'],
    correct: 1,
  },
  {
    q: 'Vem skrev romanen "Krig och fred"?',
    options: ['Fjodor Dostojevskij', 'Leo Tolstoj', 'Anton Tjechov', 'Ivan Turgenjev'],
    correct: 1,
  },
  {
    q: 'I vilket land började den industriella revolutionen?',
    options: ['Frankrike', 'Tyskland', 'Storbritannien', 'USA'],
    correct: 2,
  },
  {
    q: 'Vem skrev romanen "1984"?',
    options: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'],
    correct: 1,
  },
  {
    q: 'Vad hette kejsar Franz Josef I:s hustru?',
    options: ['Maria Theresia', 'Elisabeth ("Sisi")', 'Zita', 'Sofie'],
    correct: 1,
  },
  {
    q: 'Vad hette huvudstaden i det romerska riket?',
    options: ['Konstantinopel', 'Rom', 'Aten', 'Karthago'],
    correct: 1,
  },
  {
    q: 'Vem målade Mona Lisa?',
    options: ['Michelangelo', 'Rafael', 'Leonardo da Vinci', 'Sandro Botticelli'],
    correct: 2,
  },
  {
    q: 'Vem var USA:s första president?',
    options: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'Benjamin Franklin'],
    correct: 2,
  },
  {
    q: 'Vilket år landsteg människan på månen första gången?',
    options: ['1961', '1965', '1969', '1972'],
    correct: 2,
  },
  {
    q: 'Vilket år grundades Förenta nationerna (FN)?',
    options: ['1919', '1945', '1948', '1955'],
    correct: 1,
  },

  // ── Geografi & kultur ──
  {
    q: 'Vilken är världens största öken (till ytan)?',
    options: ['Sahara', 'Gobi', 'Antarktis', 'Kalahari'],
    correct: 2,
  },
  {
    q: 'Vilket är världens största land till ytan?',
    options: ['Kanada', 'Kina', 'Ryssland', 'USA'],
    correct: 2,
  },
  {
    q: 'Vilket språk har flest modersmålstalare i världen?',
    options: ['Engelska', 'Spanska', 'Kinesiska (mandarin)', 'Hindi'],
    correct: 2,
  },
  {
    q: 'Vad heter sångaren i bandet Coldplay?',
    options: ['Chris Martin', 'Thom Yorke', 'Matt Bellamy', 'Dave Grohl'],
    correct: 0,
  },
  {
    q: 'Vem grundade Microsoft (tillsammans med Paul Allen)?',
    options: ['Steve Jobs', 'Bill Gates', 'Elon Musk', 'Jeff Bezos'],
    correct: 1,
  },
  {
    q: 'Vem skrev pjäsen "Hamlet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Oscar Wilde', 'John Milton'],
    correct: 1,
  },
  {
    q: 'Hur många spelare står på isen per lag i en ishockeymatch?',
    options: ['4', '5', '6', '7'],
    correct: 2,
  },
  {
    q: 'Hur långt är ett maratonlopp?',
    options: ['21,1 km', '42,2 km', '50 km', '100 km'],
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
    q: 'Vilken promillegräns gäller för rattfylleri i Sverige?',
    options: ['0,2 ‰', '0,5 ‰', '0,8 ‰', '1,0 ‰'],
    correct: 0,
  },
  {
    q: 'Vad blandar man i en "Cuba Libre"?',
    options: ['Rom, cola och lime', 'Vodka och apelsin', 'Gin och tonic', 'Whisky och vatten'],
    correct: 0,
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
