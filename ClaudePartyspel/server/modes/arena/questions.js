// ── ARENA QUESTIONS ──────────────────────────────────────────────────────────
// A plain list. Shape of each entry:
//
//   { q, options: [4 strings], correct: <index 0-3> }
//    │        │                       └── rättIndex
//    │        └── alternativ
//    └── fråga
//
// Arena-quizrundan shufflar listan och cyklar igenom den, shufflar om när den
// tar slut. Ingen spellogik här.
//
// Mestadels riktig allmänbildning; en kortare svans fåniga dryckesfrågor sist.

module.exports = [
  // ── Naturvetenskap & kropp ──
  { q: 'Hur många kromosomer har en mänsklig cell?', options: ['23', '44', '46', '48'], correct: 2 },
  { q: 'Ungefär hur snabbt går ljuset?', options: ['3 000 km/s', '30 000 km/s', '300 000 km/s', '3 000 000 km/s'], correct: 2 },
  { q: 'Vilket blodkärl för syrerikt blod ut från hjärtat?', options: ['Aortan', 'Lungartären', 'Nedre hålvenen', 'Portådern'], correct: 0 },
  { q: 'Hur många hjärtan har en bläckfisk?', options: ['1', '2', '3', '4'], correct: 2 },
  { q: 'Vilket är det snabbaste landlevande djuret?', options: ['Lejon', 'Gepard', 'Antilop', 'Struts'], correct: 1 },
  { q: 'Vilket grundämne har den kemiska symbolen "O"?', options: ['Guld', 'Syre', 'Osmium', 'Kväve'], correct: 1 },
  { q: 'Vilket organ producerar insulin?', options: ['Levern', 'Bukspottkörteln', 'Mjälten', 'Njuren'], correct: 1 },
  { q: 'Vilken gas är vanligast i jordens atmosfär?', options: ['Syre', 'Kväve', 'Koldioxid', 'Argon'], correct: 1 },
  { q: 'Hur många sekunder går det på ett dygn?', options: ['3 600', '43 200', '86 400', '100 000'], correct: 2 },
  { q: 'Hur många hörn har en kub?', options: ['4', '6', '8', '12'], correct: 2 },
  { q: 'Vilken planet har de mest framträdande ringarna?', options: ['Jupiter', 'Saturnus', 'Uranus', 'Neptunus'], correct: 1 },
  { q: 'I vilken kroppsdel sitter kroppens minsta ben (hörselbenen)?', options: ['Näsan', 'Örat', 'Knäet', 'Handen'], correct: 1 },
  { q: 'Hur många ben har människans hand inklusive handleden?', options: ['19', '22', '27', '31'], correct: 2 },
  { q: 'Vad mäter pH-skalan?', options: ['Temperatur', 'Surhet', 'Vikt', 'Ljusstyrka'], correct: 1 },
  { q: 'Vad kallas en läkare som utför operationer?', options: ['Kirurg', 'Anestesiolog', 'Radiolog', 'Patolog'], correct: 0 },
  { q: 'Ungefär hur lång tid tar det för maten att gå från magsäck till tunntarm?', options: ['30 min', '60 min', '120 min', '240 min'], correct: 2 },
  { q: 'Vilken gas tar växterna upp vid fotosyntesen?', options: ['Syre', 'Koldioxid', 'Kväve', 'Vätgas'], correct: 1 },
  { q: 'Vilket är det största nu levande landdjuret?', options: ['Flodhäst', 'Noshörning', 'Afrikansk elefant', 'Giraff'], correct: 2 },

  // ── Historia ──
  { q: 'Vilket år upptäckte Columbus Amerika?', options: ['1392', '1450', '1492', '1512'], correct: 2 },
  { q: 'Vem uppfann den kommersiellt gångbara glödlampan?', options: ['Nikola Tesla', 'Thomas Edison', 'Alexander Graham Bell', 'James Watt'], correct: 1 },
  { q: 'Vad kallas perioden i Europa efter Romarrikets fall?', options: ['Antiken', 'Medeltiden', 'Renässansen', 'Upplysningen'], correct: 1 },
  { q: 'Vem skrev "Brott och straff"?', options: ['Leo Tolstoj', 'Fjodor Dostojevskij', 'Nikolaj Gogol', 'Maxim Gorkij'], correct: 1 },
  { q: 'Vilket land byggde fartyget Titanic?', options: ['USA', 'Storbritannien', 'Tyskland', 'Frankrike'], correct: 1 },
  { q: 'Vilket rike styrdes av en farao?', options: ['Persien', 'Egypten', 'Babylonien', 'Grekland'], correct: 1 },
  { q: 'Vilket år bröt första världskriget ut?', options: ['1912', '1914', '1916', '1918'], correct: 1 },

  // ── Geografi ──
  { q: 'Vilket är världens högsta berg över havet?', options: ['K2', 'Mount Everest', 'Kilimanjaro', 'Mont Blanc'], correct: 1 },
  { q: 'Vilket hav är störst?', options: ['Atlanten', 'Indiska oceanen', 'Stilla havet', 'Norra ishavet'], correct: 2 },
  { q: 'Vilken flod anses traditionellt vara världens längsta?', options: ['Amazonfloden', 'Nilen', 'Yangtze', 'Mississippi'], correct: 1 },
  { q: 'Vad heter Australiens huvudstad?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correct: 2 },
  { q: 'Vad heter Kanadas huvudstad?', options: ['Toronto', 'Ottawa', 'Vancouver', 'Montréal'], correct: 1 },
  { q: 'Vilken flod rinner genom Paris?', options: ['Themsen', 'Seine', 'Rhen', 'Donau'], correct: 1 },
  { q: 'I vilket land ligger huvudstaden Nairobi?', options: ['Nigeria', 'Kenya', 'Tanzania', 'Etiopien'], correct: 1 },
  { q: 'Hur många tidszoner har fastlands-USA?', options: ['3', '4', '5', '6'], correct: 1 },
  { q: 'Vilket är världens minsta självständiga land?', options: ['Monaco', 'San Marino', 'Vatikanstaten', 'Nauru'], correct: 2 },
  { q: 'Vad heter Greklands huvudstad?', options: ['Thessaloniki', 'Aten', 'Sparta', 'Korinth'], correct: 1 },
  { q: 'Hur många länder gränsar till Sverige på land?', options: ['1', '2', '3', '4'], correct: 1 },
  { q: 'Vilket land har yen som valuta?', options: ['Kina', 'Japan', 'Sydkorea', 'Thailand'], correct: 1 },

  // ── Kultur & sport ──
  { q: 'Hur många spelare har ett fotbollslag på planen?', options: ['9', '10', '11', '12'], correct: 2 },
  { q: 'Hur många poäng ger en "touchdown" i amerikansk fotboll?', options: ['3', '6', '7', '8'], correct: 1 },
  { q: 'Hur många ringar finns på den olympiska flaggan?', options: ['3', '4', '5', '6'], correct: 2 },
  { q: 'Hur många tangenter har ett vanligt piano?', options: ['66', '76', '88', '96'], correct: 2 },
  { q: 'Hur många strängar har en vanlig akustisk gitarr?', options: ['4', '5', '6', '12'], correct: 2 },
  { q: 'Vem komponerade "Ödessymfonin" (symfoni nr 5)?', options: ['Mozart', 'Beethoven', 'Bach', 'Chopin'], correct: 1 },
  { q: 'Vilket land arrangerade sommar-OS 2016?', options: ['Storbritannien', 'Brasilien', 'Japan', 'Kina'], correct: 1 },
  { q: 'Vad heter Sveriges regerande kung?', options: ['Carl XVI Gustaf', 'Gustaf VI Adolf', 'Carl XV', 'Oscar II'], correct: 0 },

  // ── Fåniga & dryck ──
  { q: 'Vad rymmer "en stor stark" på krogen oftast?', options: ['33 cl', '40 cl', '50 cl', '75 cl'], correct: 1 },
  { q: '"Systemet" är ett vardagligt namn för vad?', options: ['Tunnelbanan', 'Systembolaget', 'Skatteverket', 'Försäkringskassan'], correct: 1 },
  { q: 'Hur säger man "skål" på japanska?', options: ['Prost', 'Salute', 'Kanpai', 'Cheers'], correct: 2 },
  { q: 'Vad blandas i en "Screwdriver"?', options: ['Vodka och apelsinjuice', 'Rom och cola', 'Gin och tonic', 'Whisky och ingefärsöl'], correct: 0 },
  { q: 'Vilken frukt läggs oftast i en Gin & Tonic?', options: ['Citron eller lime', 'Äpple', 'Vindruva', 'Jordgubbe'], correct: 0 },
  { q: 'Vilken dryck görs av jäst honung och vatten?', options: ['Mjöd', 'Cider', 'Portvin', 'Sake'], correct: 0 },
  { q: 'Vilken dryck förknippas mest med tyska Oktoberfest?', options: ['Vin', 'Öl', 'Cider', 'Whisky'], correct: 1 },
  { q: 'Hur mycket rymmer en svensk "helflaska" sprit?', options: ['0,5 liter', '0,7 liter', '1 liter', '1,5 liter'], correct: 1 },
  { q: '"Bakis" är slang för vad?', options: ['Hungrig', 'Bakfull', 'Trött efter jobbet', 'Förkyld'], correct: 1 },
];
