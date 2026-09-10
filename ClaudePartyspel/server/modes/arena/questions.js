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
// Blandning: allmänbildning, popkultur och fåniga dryckesfrågor. Håll dem
// korta — bara en spelare i taget läser frågan på sin mobil.

module.exports = [
  // ── Allmänbildning ──
  { q: 'Vad heter Danmarks huvudstad?', options: ['Odense', 'Köpenhamn', 'Aarhus', 'Aalborg'], correct: 1 },
  { q: 'Hur många grader är en rät vinkel?', options: ['45', '90', '180', '360'], correct: 1 },
  { q: 'Vilket organ renar blodet och bildar urin?', options: ['Levern', 'Njurarna', 'Lungorna', 'Mjälten'], correct: 1 },
  { q: 'Vad heter världens största varma öken?', options: ['Sahara', 'Gobi', 'Kalahari', 'Atacama'], correct: 0 },
  { q: 'Hur många planeter har vårt solsystem (efter 2006)?', options: ['7', '8', '9', '10'], correct: 1 },
  { q: 'Vilket år startade andra världskriget?', options: ['1914', '1929', '1939', '1945'], correct: 2 },
  { q: 'Vad kallas övergången när vatten blir vattenånga?', options: ['Kondensation', 'Avdunstning', 'Smältning', 'Sublimering'], correct: 1 },
  { q: 'Vilket är det största nu levande djuret?', options: ['Afrikansk elefant', 'Blåval', 'Kaskelot', 'Giraff'], correct: 1 },
  { q: 'Hur många tänder har en vuxen människa normalt?', options: ['26', '28', '32', '36'], correct: 2 },
  { q: 'Vad heter Norges huvudstad?', options: ['Bergen', 'Oslo', 'Trondheim', 'Stavanger'], correct: 1 },
  { q: 'Hur många sidor har en kub?', options: ['4', '6', '8', '12'], correct: 1 },
  { q: 'Vilket språk talar man i Brasilien?', options: ['Spanska', 'Portugisiska', 'Franska', 'Italienska'], correct: 1 },
  { q: 'Vad är H₂O mer känt som?', options: ['Salt', 'Socker', 'Vatten', 'Syre'], correct: 2 },
  { q: 'Hur många ben har en insekt?', options: ['4', '6', '8', '10'], correct: 1 },

  // ── Popkultur ──
  { q: 'Vem spelar Iron Man i Marvel-filmerna?', options: ['Chris Evans', 'Robert Downey Jr', 'Mark Ruffalo', 'Chris Hemsworth'], correct: 1 },
  { q: 'Vilken app är känd för korta videor och dansutmaningar?', options: ['LinkedIn', 'TikTok', 'Spotify', 'Pinterest'], correct: 1 },
  { q: 'Vilken möbeljätte kommer från Sverige?', options: ['Mio', 'IKEA', 'Jysk', 'EM Home'], correct: 1 },
  { q: 'Vilken färg har fisken Nemo i "Hitta Nemo"?', options: ['Blå', 'Orange', 'Gul', 'Röd'], correct: 1 },
  { q: 'Vilket land kommer bandet ABBA ifrån?', options: ['Norge', 'Danmark', 'Sverige', 'Finland'], correct: 2 },
  { q: 'I vilket spel bygger man med block och möter "creepers"?', options: ['Fortnite', 'Roblox', 'Minecraft', 'Terraria'], correct: 2 },
  { q: 'Vad heter den gröna huvudpersonen i "Shrek"?', options: ['Shrek', 'Fiona', 'Åsnan', 'Lord Farquaad'], correct: 0 },
  { q: 'Vilken svensk fotbollsspelare kallas ofta "Ibra"?', options: ['Henrik Larsson', 'Zlatan Ibrahimović', 'Emil Forsberg', 'Victor Lindelöf'], correct: 1 },
  { q: 'Vad heter rymdskeppet i "Star Trek"?', options: ['Millennium Falcon', 'USS Enterprise', 'Serenity', 'Nostromo'], correct: 1 },
  { q: 'Vilket företag äger sökmotorn med samma namn som talet 10¹⁰⁰?', options: ['Meta', 'Google', 'Amazon', 'Microsoft'], correct: 1 },
  { q: 'Vem sjunger originalet "Dancing Queen"?', options: ['ABBA', 'Roxette', 'Ace of Base', 'A-teens'], correct: 0 },
  { q: 'Vad heter superhjälten som är Peter Parker?', options: ['Batman', 'Spider-Man', 'Superman', 'Daredevil'], correct: 1 },

  // ── Fåniga & dryck ──
  { q: 'Vad rymmer "en stor stark" på krogen oftast?', options: ['33 cl', '40 cl', '50 cl', '75 cl'], correct: 1 },
  { q: 'Vilket land dricker traditionellt mest te per person?', options: ['Italien', 'Turkiet', 'Spanien', 'Brasilien'], correct: 1 },
  { q: 'Vilken dryck görs av jästa druvor?', options: ['Öl', 'Vin', 'Cider', 'Mjöd'], correct: 1 },
  { q: '"Systemet" är ett vardagligt namn för vad?', options: ['Tunnelbanan', 'Systembolaget', 'Skatteverket', 'Försäkringskassan'], correct: 1 },
  { q: 'Hur säger man "skål" på japanska?', options: ['Prost', 'Salute', 'Kanpai', 'Cheers'], correct: 2 },
  { q: 'Vilken frukt läggs oftast i en Gin & Tonic?', options: ['Citron eller lime', 'Äpple', 'Vindruva', 'Jordgubbe'], correct: 0 },
  { q: 'Vad kallas en alkoholfri drink på restaurang?', options: ['Mocktail', 'Highball', 'Sour', 'Shrub'], correct: 0 },
  { q: 'Vilken snapsvisa börjar "Helan går"?', options: ['En midsommarnattsdröm', 'Helan går', 'Kalle P', 'Änglamark'], correct: 1 },
  { q: 'Vad blandas i en "Screwdriver"?', options: ['Vodka och apelsinjuice', 'Rom och cola', 'Gin och tonic', 'Whisky och ingefärsöl'], correct: 0 },
  { q: 'Ungefär hur många kalorier har ett glas (33 cl) lager-öl?', options: ['ca 50', 'ca 150', 'ca 350', 'ca 600'], correct: 1 },
  { q: 'Vad heter drycken av jäst honung och vatten?', options: ['Mjöd', 'Cider', 'Portvin', 'Sake'], correct: 0 },
  { q: 'Hur många cl är en "fyra" (klassisk drinkmängd sprit)?', options: ['2 cl', '4 cl', '6 cl', '8 cl'], correct: 1 },
];
