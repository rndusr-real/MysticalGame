// ♥ Itt szerkeszthető a teljes játék. A többi fájlhoz nem kell hozzányúlni. ♥
//
// Új szint: másolj be egy { ... } blokkot a "levels" listába, a szintek száma ebből adódik.
// Vigyázz, hogy minden szöveg idézőjelben legyen, és minden blokk után maradjon vessző.
//
// A történet sorokból áll. Egy sor így néz ki:
//   { who: "momo", mood: "smile", text: "Szia!" }
// who:    ki beszél (lásd a "cast" részt). Ha elhagyod, a sor narráció.
// mood:   arckifejezés: neutral, smile, happy, smug, surprised, sad, sleepy.
// name:   a kiírt név felülírása, pl. "???". Elhagyható.
// show:   kik állnak a színpadon, pl. ["momo", "yoru"]. A beszélő magától is megjelenik.
// bg:     helyszín: gate, bloom, hall, room, lab, door, dawn. Elhagyható.
// all:    mindenki egyszerre szól, ez az arckifejezésük, pl. all: "happy". Elhagyható.
// shadow: true esetén a szereplők csak sziluettek világító szemmel, false esetén újra láthatók.
// lights: false esetén kialszanak a fények, true esetén visszajönnek.
// fx:     különleges hatás: flash, shake, burst. Elhagyható.

const GAME = {
  title: "Pink Puzzle",

  // Ez fogad az oldal megnyitásakor.
  welcome: "Már vártunk téged, Peti-kun =￣ω￣=",

  // A szereplők neve és színei. A hairStyle lehet: twintails, long, fluffy.
  // A voice: true szereplőnek nincs rajza, csak a hangját halljuk. Ilyenkor elég a name és a color.
  cast: {
    momo: {
      name: "Momo",
      color: "#ff9fd0",
      mood: "smile",
      hairStyle: "twintails",
      hair: ["#ffc9e4", "#ff86c0", "#d9478f"],
      eyes: ["#ff5fa8", "#b3125f"],
      robe: ["#fff4fa", "#f6c9e0"],
      trim: "#e0246f",
    },
    yoru: {
      name: "Yoru",
      color: "#ffd98a",
      mood: "neutral",
      hairStyle: "long",
      hair: ["#6d3a94", "#3a1858", "#1b0930"],
      eyes: ["#ffd36e", "#c9651a"],
      robe: ["#47164f", "#1c0722"],
      trim: "#ff5fa8",
    },
    mochi: {
      name: "Mochi",
      color: "#d9b8ff",
      mood: "sleepy",
      hairStyle: "fluffy",
      hair: ["#fff8fc", "#f3dcf5", "#c3a0e0"],
      eyes: ["#c06bff", "#6a2bb0"],
      robe: ["#d3b4f2", "#8a66c9"],
      trim: "#fff0f8",
    },
    zambo: {
      name: "Zámbó-sensei",
      color: "#9fe8ff",
      voice: true,
    },
  },

  // A legelső jelenet, az első szint előtt.
  introBg: "gate",
  intro: [
    { text: "Éjfél után a város elnémul." },
    { text: "Az utca végén világít egy kapu. Esküdnél rá, hogy tegnap még nem volt itt." },
    { show: ["momo", "yoru", "mochi"], shadow: true, text: "A kapu alatt három pár szem figyel." },
    { who: "momo", name: "???", text: "Nocsak. Tényleg eljött." },
    { who: "yoru", name: "???", text: "Mondtam. Ő mindig idetalál." },
    { who: "mochi", name: "???", text: "...álmos vagyok. Kezdhetjük?" },
    { who: "momo", mood: "happy", shadow: false, fx: "flash", text: "Bocsi a drámáért! Momo vagyok, a szentély legcukibb lakója. Miau." },
    { who: "yoru", mood: "neutral", text: "Yoru. A kapu őrzője. Hét zár áll közted és aközött, amiért idehívtunk." },
    { who: "mochi", mood: "sleepy", text: "Mochi. Én csak itt alszom. Néha." },
    { who: "momo", mood: "smug", text: "Hogy mi van a zárak mögött? Azt nem mondhatjuk el, Peti-kun. Nyisd ki őket, és megtudod." },
  ],

  // Az utolsó szint utáni jelenet. Utána jön a "Kész vagy!" felirat.
  // Egyik sem jelenik meg, amíg az utolsó szinten ott a final: true.
  endingBg: "dawn",
  ending: [
    { fx: "flash", text: "Az utolsó zár is kattan. Az ajtó hangtalanul kitárul." },
    { text: "Mögötte nincs kincs. Csak lámpások, gyertyák, és egy gyanúsan nagy torta." },
    { show: ["momo", "yoru", "mochi"], who: "momo", mood: "happy", fx: "burst", text: "Meglepetés! Hát ezért vártunk rád, Peti-kun!" },
    { who: "yoru", mood: "smile", text: "Minden titok ugyanazt jelentette. Hogy ma éjjel minden rólad szól." },
    { who: "mochi", mood: "smile", text: "Miattad fent maradtam. Ezt értékeld." },
    { all: "happy", name: "Mindhárman", fx: "burst", text: "Boldog szülinapot, Peti-kun! =^ω^=" },
  ],

  // A közös zene helye (mp3 vagy wav), azokon a szinteken szól, ahol nincs saját zene.
  // Üresen ("") ezeken a szinteken nincs zene.
  music: "assets/music.mp3",

  // Ennyi másodpercet vár a zene, mielőtt elindul, és ismétlés előtt is.
  musicDelay: 3,

  // Ez jelenik meg, ha valaki az összes szintet megoldotta.
  winTitle: "Kész vagy!",
  winText: "Minden szintet megoldottál, te kis zseni. ♥",

  levels: [
    {
      // music: a szint saját zenéje (mp3 vagy wav), amíg ezen a szinten vagy, ismétlődve szól. Elhagyható.
      music: "morse.wav",
      // answers: a jó válaszok. Több is megadható. A kis- és nagybetű nem számít, az ékezet igen.
      answers: ["tigris"],
      // hint: elhagyható. Ha kitörlöd ezt a sort, a hint doboza sem jelenik meg.
      // wrong: rossz válaszra ezek jönnek sorban, a lista végén elölről kezdve. Bármennyi lehet.
      wrong: [
        "Gondolkozz faszfej",
        "A füleden ülsz?",
        "Hmm, közel sem. Gondolj valami szőrösre!",
        "rawr",
        "miau(nagy(nagyon))",
        "cica"
      ],
      // chapter: a fejezet címe. bg: a helyszín. scene: a szint előtti jelenet. Mind elhagyható.
      chapter: "Kopogás a falon túlról",
      bg: "hall",
      scene: [
        { text: "A folyosó végén valami kopog. Rövid. Hosszú. Szünet." },
        { show: ["yoru", "momo"], who: "yoru", mood: "neutral", text: "A szentély legrégebbi lakója. Minden éjjel ugyanazt üzeni, és még senki sem válaszolt neki." },
        { who: "momo", mood: "smug", text: "Szerintem csak nagyon nagy cica. De én mindenkire ezt mondom." },
      ],
      // ask: ez a kérdés hangzik el a válaszmező mellett.
      ask: { who: "yoru", mood: "neutral", text: "Hallgasd figyelmesen, Peti-kun. Mit üzen a kopogás?" },
    },
    {
      answers: ["sötétség", "sötét", "sotet", "sotetseg"],
      hint: "Minél több van belőle, annál kevesebbet látsz.",
      wrong: [
        "Aww, majdnem! Vagyis nem.",
        "Gabi",
        "Kapcsold le a lámpát, hátha beugrik!",
        "Éjszaka mindenhol ott van...",
      ],
      chapter: "Kihunyó lámpások",
      bg: "hall",
      scene: [
        { show: ["momo", "yoru", "mochi"], who: "yoru", mood: "neutral", text: "A második zár nem szereti, ha nézik." },
        { lights: false, text: "A lámpások egyenként kihunynak." },
        { who: "momo", mood: "surprised", fx: "shake", text: "Hé! Ki lépett a farkamra?!" },
        { who: "mochi", mood: "sleepy", text: "Én. Bocsi." },
      ],
      ask: { who: "yoru", mood: "neutral", text: "Innen már nem látlak, Peti-kun. Mondd meg a választ, és visszajön a fény." },
    },
    {
      // Ennek a szintnek nincs hintje: itt csak a visszajelzések segítenek.
      answers: ["rózsaszín", "pink", "rozsaszin"],
      wrong: [
        "Nincs hint, drágám. Nézz körül!",
        "Nem hordod pedig szereted.",
        "Na jó, a gomb, a háttér és a szívecskék is ilyenek dummah.",
      ],
      chapter: "Nézz körül",
      bg: "bloom",
      scene: [
        { fx: "flash", text: "Visszatér a fény, de már nem ugyanaz a fény." },
        { text: "A fák, a köd, még a hold is egyetlen színbe öltözött." },
        { show: ["momo", "mochi"], who: "momo", mood: "happy", text: "Na? Ugye gyönyörű? Ez a kedvencem!" },
        { who: "mochi", mood: "sleepy", text: "Erre a zárra nincs nyom. Soha nem is kellett." },
      ],
      ask: { who: "momo", mood: "smug", text: "Nyisd ki a szemed, Peti-kun, és mondd ki a jelszót." },
    },
    {
      answers: ["fésű"],
      hint: "Van foga, mégsem harap.",
      wrong: [
        "Hibás válasz, de a frizurád attól még tökéletes.",
        "Nem ez az. Reggelente szükséged van rá.",
        "A hajadban szokott járni.",
      ],
      chapter: "A kis tolvaj",
      bg: "room",
      scene: [
        { text: "Momo szobájában nyitva az ablak. Az asztalon egy üres hely porosodik." },
        { show: ["momo", "mochi"], who: "momo", mood: "sad", text: "Tragédia! Eltűnt valami az asztalomról, pedig minden reggel itt hagyom." },
        { who: "mochi", mood: "sleepy", text: "Láttam a tettest. Tele van a szája, mégsem eszik soha." },
        { who: "momo", mood: "surprised", fx: "shake", text: "Nem érdekel, csak legyen meg! Így nem mehetek emberek elé!" },
      ],
      ask: { who: "mochi", mood: "sleepy", text: "Mi tűnt el, Peti-kun? Mondd meg gyorsan... aztán alhatok." },
    },
    {
      // HELYŐRZŐ! Írd át arra a szóra, ami a Classroom "Éjféli zár" feladatának leírásában áll.
      answers: ["boldog szulinapot peti", "boldog szülinapot peti","boldog szülinapot Peti","boldog szulinapot Peti"],
      hint: "Az AI nem mindig olyan hasznos ám!",
      wrong: [
        "Ez nem az. A sensei feladta a feladatot.",
        "Nem olvasta el a feladatot, ugye?",
        "Az utolso feladat Peti-kun. Azt olvassa, ne a monitort nézze.",
        "Kicsit mélyebben elemezze Peti-kun a feladatot"
      ],
      chapter: "Az éjféli házi",
      bg: "lab",
      scene: [
        { text: "A szentély mélyén egy tolóajtó mögül hideg fény szivárog. Valaki nem kapcsolta ki a gépeket." },
        { show: ["momo", "yoru"], who: "momo", mood: "surprised", text: "Ki hagy bekapcsolva egy egész géptermet egy szentélyben?!" },
        { who: "yoru", mood: "neutral", text: "Az ötödik zárat nem mi tettük ide. Őt már akkor sem lehetett kizárni, amikor mi jöttünk." },
        { who: "zambo", fx: "flash", text: "Jó estét, Peti-kun. Látom, megint az utolsó pillanatban érkezett." },
        { who: "zambo", text: "Ezt a zárat nem itt fogja kinyitni. A megoldást már rég feladtam, csak el kellett volna olvasnia." },
        { who: "mochi", mood: "sleepy", text: "Házi feladat? Éjfélkor? Én visszaalszom." },
        { show: ["momo", "yoru"], text: "Mochi már el is tűnt. A monitor továbbra is rád vár." },
      ],
      ask: { who: "zambo", text: "Nos, Peti-kun? Mi áll a feladatban?" },
    },
    {
      // quiet: ezen a szinten semmilyen zene nem szól.
      quiet: true,
      answers: ["csend"],
      hint: "Ha kimondod a nevem, már nem is vagyok.",
      wrong: [
        "Psszt, ez most nem talált.",
        "Ez a zár nem adja könnyen magát!",
        "Akkor van itt, amikor senki sem szól.",
      ],
      chapter: "Az utolsó ajtó",
      bg: "door",
      scene: [
        { text: "A szentély legmélyén egy kerek ajtó vár. Nincs rajta kilincs." },
        { show: ["momo", "yoru", "mochi"], who: "yoru", mood: "neutral", text: "Ez a zár nem kér kulcsot. Csak annyit kér, hogy figyelj." },
        { who: "momo", mood: "smile", text: "Most én sem szólok semmit. Tényleg. Figyeld, ahogy nem szólok. Még mindig nem szólok." },
        { who: "yoru", mood: "smug", text: "Momo." },
        { who: "momo", mood: "sad", text: "..." },
      ],
      ask: { who: "yoru", mood: "neutral", text: "Hallod? Ez most itt van közöttünk, Peti-kun. Addig, amíg ki nem mondod." },
    },
    {
      // final: itt ér véget a játék. Csak a fejezetcím és a hint jelenik meg, válaszmező nélkül.
      final: true,
      hint: "Derike droppolt oioioioioi",
      chapter: "Momo kiposztolta",
      bg: "door",
    },
  ],

  // A felület apró szövegei.
  texts: {
    enter: "Belépés",
    resume: "Folytatás",
    prologue: "Prológus",
    chapter: "fejezet",
    soundOn: "Hang: be",
    soundOff: "Hang: ki",
    level: "szint",
    hint: "Hint",
    placeholder: "Írd ide a választ...",
    submit: "Küldés",
    correct: "Eltaláltad! ♥",
    wrongDefault: "Ez most nem talált, próbáld újra!",
    restart: "Újrakezdés",
  },
};
