(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // Hibás levels.js (pl. kimaradt vessző) esetén legyen látható, mi a gond.
  if (typeof GAME === "undefined") {
    $("welcome-text").textContent = "Hoppá!";
    $("title").textContent = "Hiba van a levels.js fájlban. Nézd meg a vesszőket és az idézőjeleket!";
    $("title").style.animation = "none";
    $("title").style.opacity = 1;
    $("title").style.letterSpacing = "normal";
    $("title").style.textTransform = "none";
    $("enter").hidden = true;
    return;
  }

  const LEVEL_KEY = "pink-puzzle:level";
  const SOUND_KEY = "pink-puzzle:sound";
  const NEXT_LEVEL_DELAY = 1100;
  const ACCESS_TIMEOUT = 3000;
  const ACCESS_POLL = 15000;
  const MUSIC_VOLUME = 0.5;
  const TYPE_SPEED = 26;
  const CURTAIN_FADE = 900;
  const CHAPTER_HOLD = 2300;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const SLOTS = { 1: [50], 2: [30, 70], 3: [20, 50, 80] };
  const WRONG_MOODS = ["smug", "surprised", "sad", "smile"];

  const levels = GAME.levels || [];
  const texts = GAME.texts || {};
  const people = GAME.cast || {};
  // Csökkentett mozgásnál csak a nagy mozgások maradnak el, a finom animációk nem. A többi a style.css végén van.
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let current = 0;
  let wrongCount = 0;
  let locked = false;
  let story = null;
  let asker = null;
  let soundOn = true;
  let lockedLevels = new Set();
  let waitingForAccess = false;

  // A localStorage tiltott lehet, ilyenkor a játék mentés nélkül fut.
  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* nincs mentés */ }
  }

  function normalize(text) {
    return String(text).normalize("NFC").trim().toLowerCase();
  }

  function isCorrect(level, guess) {
    return (level.answers || []).some((answer) => normalize(answer) === guess);
  }

  // Az animáció újraindításához ki kell kényszeríteni egy újrarajzolást.
  function replay(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function renderProgress() {
    const progress = $("progress");
    progress.replaceChildren();
    progress.setAttribute("aria-label", Math.min(current, levels.length) + " / " + levels.length);
    levels.forEach((_, index) => {
      const pip = document.createElement("span");
      pip.textContent = "♥︎";
      pip.className = "pip" + (index < current && !isLocked(index) ? " done" : index === current ? " now" : "");
      progress.appendChild(pip);
    });
  }

  /* ---------- Színpad ---------- */

  const stage = { background: "", sprites: {}, onStage: [] };

  function setBackground(name) {
    if (name === stage.background) return;
    stage.background = name;
    const world = $("world");
    const old = Array.from(world.children);
    const scene = document.createElement("div");
    scene.className = "scene";
    scene.innerHTML = ART.scene(name);
    world.appendChild(scene);
    void scene.offsetWidth;
    scene.classList.add("shown");
    setTimeout(() => old.forEach((element) => element.remove()), 1700);
  }

  function spriteFor(id) {
    if (stage.sprites[id]) return stage.sprites[id];
    const look = people[id];
    if (!look || look.voice) return null;
    const element = document.createElement("div");
    element.className = "sprite";
    element.style.setProperty("--blink", -Object.keys(stage.sprites).length * 1.7 + "s");
    element.innerHTML = ART.sprite(look);
    $("cast").appendChild(element);
    stage.sprites[id] = element;
    setMood(id, look.mood);
    return element;
  }

  function setMood(id, mood) {
    const element = spriteFor(id);
    if (!element || element.dataset.mood === mood) return;
    const gradient = element.querySelector("[id$='-iris']").id.replace(/-iris$/, "");
    element.dataset.mood = mood;
    element.querySelector(".face").innerHTML = ART.face(mood, gradient);
  }

  function setCast(ids) {
    const shown = ids.filter((id) => spriteFor(id));
    const slots = SLOTS[shown.length] || SLOTS[3];
    stage.onStage = shown;
    Object.keys(stage.sprites).forEach((id) => {
      const element = stage.sprites[id];
      const place = shown.indexOf(id);
      element.classList.toggle("on", place >= 0);
      if (place >= 0) element.style.setProperty("--slot", slots[Math.min(place, slots.length - 1)] + "%");
    });
  }

  // A "*" mindenkit kivilágít.
  function setSpeaker(id) {
    Object.keys(stage.sprites).forEach((key) => {
      stage.sprites[key].classList.toggle("speaking", id === "*" || key === id);
    });
  }

  function setNight(on) {
    Object.keys(stage.sprites).forEach((id) => stage.sprites[id].classList.toggle("night", on));
  }

  function playEffect(name) {
    if (name === "flash") replay($("flash"), "go");
    if (name === "shake") replay($("stage"), "shake");
    if (name === "burst") burst(60);
  }

  /* ---------- Sorok és jelenetek ---------- */

  let typing = null;

  function finishTyping() {
    if (!typing) return false;
    clearInterval(typing.timer);
    $("line-shown").textContent = typing.text;
    $("line-rest").textContent = "";
    const done = typing.done;
    typing = null;
    if (done) done();
    return true;
  }

  function typeLine(text, done) {
    if (typing) {
      clearInterval(typing.timer);
      typing = null;
    }
    const letters = Array.from(text);
    $("live").textContent = text;
    $("line-shown").textContent = "";
    $("line-rest").textContent = text;
    if (!letters.length) {
      $("line-shown").textContent = text;
      $("line-rest").textContent = "";
      if (done) done();
      return;
    }
    let count = 0;
    typing = { text, done, timer: setInterval(() => {
      count += 1;
      $("line-shown").textContent = letters.slice(0, count).join("");
      $("line-rest").textContent = letters.slice(count).join("");
      if (count >= letters.length) finishTyping();
    }, TYPE_SPEED) };
  }

  // Egy sor beállításai a színpadon maradnak a következő sorokra is.
  function applyStage(line) {
    if (line.bg) setBackground(line.bg);
    if (line.show) setCast(line.show);
    if (line.who && !stage.onStage.includes(line.who)) setCast(stage.onStage.concat(line.who));
    if (line.lights !== undefined) {
      $("darkness").classList.toggle("on", !line.lights);
      setNight(!line.lights);
    }
    if (line.shadow !== undefined) setNight(line.shadow);
    if (line.who && line.mood) setMood(line.who, line.mood);
    if (line.all) stage.onStage.forEach((id) => setMood(id, line.all));
  }

  function showLine(line, done) {
    const person = people[line.who];
    const name = line.name || (person && person.name) || "";
    applyStage(line);
    setSpeaker(line.all ? "*" : person ? line.who : null);
    if (line.fx) playEffect(line.fx);
    $("dialog").classList.toggle("narration", !name);
    $("speaker").hidden = !name;
    $("speaker").textContent = name;
    $("speaker").style.setProperty("--tone", (person && !line.name && person.color) || "");
    $("next").hidden = true;
    typeLine(line.text || "", done);
  }

  function playScene(lines, done) {
    let index = -1;
    story = { lines, done, next() {
      if (finishTyping()) return;
      index += 1;
      if (index >= lines.length) {
        endScene();
        return;
      }
      showLine(lines[index], () => { $("next").hidden = false; });
    } };
    story.next();
  }

  function endScene() {
    const finished = story;
    story = null;
    $("next").hidden = true;
    if (typing) {
      clearInterval(typing.timer);
      typing = null;
    }
    finished.done();
  }

  function handleStageClick(event) {
    if (!story || event.target.closest("button, input, form, a")) return;
    story.next();
  }

  function handleKey(event) {
    if (!story || (event.key !== "Enter" && event.key !== " ")) return;
    if (event.target.closest && event.target.closest("button, input")) return;
    event.preventDefault();
    story.next();
  }

  // Elsötétít, közben átrendezi a színpadot, majd újra kivilágosodik.
  // A fejezetcím kattintással átugorható.
  function curtain(number, title, middle, after) {
    const element = $("curtain");
    const fade = CURTAIN_FADE;
    const hold = number || title ? CHAPTER_HOLD : 250;
    let timer = null;

    function lift() {
      clearTimeout(timer);
      element.removeEventListener("click", lift);
      element.classList.remove("on");
      setTimeout(after, fade * 0.6);
    }

    $("curtain-number").textContent = number;
    $("curtain-title").textContent = title;
    element.classList.add("on");
    setTimeout(() => {
      middle();
      element.addEventListener("click", lift);
      timer = setTimeout(lift, hold);
    }, fade);
  }

  /* ---------- Szintek ---------- */

  function openPuzzle() {
    const level = levels[current];
    const ask = level.ask || {};
    const hint = String(level.hint || "").trim();

    asker = ask.who || stage.onStage[0] || null;
    locked = false;
    wrongCount = 0;
    $("dialog").classList.add("asking");
    $("win").hidden = true;
    $("puzzle").hidden = false;
    $("hint").hidden = !hint;
    $("hint-text").textContent = hint;
    $("answer").value = "";
    $("answer").disabled = false;
    $("submit").disabled = false;
    showLine({ text: ask.text || (current + 1 + ". " + (texts.level || "")), name: ask.who ? undefined : "♥", who: asker, mood: ask.mood });
    $("answer").focus();
  }

  // A záró fejezet: csak a hint marad a képernyőn, innen nincs tovább.
  function showFinal() {
    const hint = String(levels[current].hint || "").trim();
    $("dialog").classList.remove("narration");
    $("dialog").classList.add("asking");
    $("line").hidden = true;
    $("form").hidden = true;
    $("puzzle").hidden = false;
    $("hint").hidden = !hint;
    $("hint-text").textContent = hint;
    $("live").textContent = hint;
  }

  function startStory(lines, done) {
    if (lines && lines.length) playScene(lines, done);
    else done();
  }

  // Üres színpad és üres párbeszéd a függöny mögött, alapállásban lévő arcokkal.
  function clearStage(background) {
    $("darkness").classList.remove("on");
    setNight(false);
    setCast([]);
    Object.keys(stage.sprites).forEach((id) => setMood(id, people[id].mood));
    setBackground(background);
    $("dialog").hidden = false;
    $("dialog").classList.add("narration");
    $("dialog").classList.remove("asking");
    $("speaker").hidden = true;
    $("line-shown").textContent = "";
    $("line-rest").textContent = "";
    $("next").hidden = true;
    $("line").hidden = false;
    $("form").hidden = false;
    $("puzzle").hidden = true;
    $("win").hidden = true;
  }

  function chapterNumber(index) {
    return ROMAN[index] ? ROMAN[index] + ". " + (texts.chapter || "") : "";
  }

  /* ---------- Hozzáférés ---------- */

  // Az api/access listáját a krumplisteszta.html írja. Ha nem érhető el, a legutóbbi állapot marad.
  function refreshAccess() {
    const request = fetch("api/access?t=" + Date.now(), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.locked)) lockedLevels = new Set(data.locked);
      })
      .catch(() => {});
    const timeout = new Promise((resolve) => setTimeout(resolve, ACCESS_TIMEOUT));
    return Promise.race([request, timeout]);
  }

  // A lista a fejezetek sorszámát tárolja, ezek 1-től indulnak.
  function isLocked(index) {
    return lockedLevels.has(index + 1);
  }

  // A zárolt szinteket átugorja. Ha előre már nincs nyitott szint, null az eredmény.
  function nextOpenLevel(from) {
    for (let i = from; i < levels.length; i++) {
      if (!isLocked(i)) return i;
    }
    return from >= levels.length ? from : null;
  }

  function showWaiting() {
    const waiting = GAME.waiting || {};
    renderProgress();
    setTrack("");
    curtain("", "", () => {
      $("chapter-label").textContent = "";
      clearStage(waiting.bg || stage.background || "door");
    }, () => {
      showLine(waiting);
      waitingForAccess = true;
    });
  }

  // Játék közben is figyeli a listát: a várakozót továbbengedi, a lezárt feladatról továbblép.
  function watchAccess() {
    setInterval(() => {
      if (document.hidden) return;
      refreshAccess().then(() => {
        if (waitingForAccess) {
          if (nextOpenLevel(current) === null) return;
          waitingForAccess = false;
          renderLevel();
        } else if (!locked && isLocked(current)) {
          renderLevel();
        }
      });
    }, ACCESS_POLL);
  }

  function renderLevel() {
    locked = true;
    refreshAccess().then(showOpenLevel);
  }

  function showOpenLevel() {
    const next = nextOpenLevel(current);
    if (next === null) {
      showWaiting();
      return;
    }
    if (next !== current) {
      current = next;
      save(LEVEL_KEY, String(current));
    }
    renderProgress();
    setTrack(trackFor(current));

    if (current >= levels.length) {
      playEnding();
      return;
    }

    const level = levels[current];
    const number = chapterNumber(current);
    curtain(number, level.chapter || "", () => {
      $("chapter-label").textContent = (number + " · " + (level.chapter || "")).replace(/^ · | · $/g, "");
      clearStage(level.bg || stage.background || "gate");
    }, () => startStory(level.scene, level.final ? showFinal : openPuzzle));
  }

  function playEnding() {
    curtain("", "", () => {
      $("chapter-label").textContent = "";
      clearStage(GAME.endingBg || "dawn");
    }, () => startStory(GAME.ending, showWin));
  }

  function showWin() {
    $("dialog").hidden = true;
    $("win").hidden = false;
    $("restart").focus();
    setSpeaker("*");
    burst(60);
  }

  function goTo(index) {
    current = index;
    save(LEVEL_KEY, String(current));
    renderLevel();
  }

  function handleWrong(level) {
    const messages = level.wrong || [];
    const message = messages.length ? messages[wrongCount % messages.length] : texts.wrongDefault;
    const mood = WRONG_MOODS[wrongCount % WRONG_MOODS.length];
    wrongCount += 1;
    showLine({ text: message, who: asker, mood });
    replay($("stage"), "shake");
    $("answer").select();
  }

  function handleCorrect() {
    locked = true;
    $("answer").disabled = true;
    $("submit").disabled = true;
    showLine({ text: texts.correct, who: asker, mood: "happy", fx: "flash", lights: true });
    burst(32);
    setTimeout(() => goTo(current + 1), NEXT_LEVEL_DELAY);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (locked) return;

    const guess = normalize($("answer").value);
    if (!guess) {
      $("answer").focus();
      return;
    }

    const level = levels[current];
    if (isCorrect(level, guess)) handleCorrect();
    else handleWrong(level);
  }

  /* ---------- Díszek ---------- */

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function burst(count) {
    const tones = ["#ff4f9f", "#ff8cc6", "#ffc4e2", "#ffffff"];
    const shapes = ["♥︎", "✦︎", "♡︎"];
    const box = $("confetti");
    for (let i = 0; i < count; i++) {
      const bit = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const reach = randomBetween(90, Math.max(window.innerWidth, window.innerHeight) * 0.5);
      bit.className = "bit";
      bit.textContent = shapes[i % shapes.length];
      bit.style.setProperty("--tone", tones[i % tones.length]);
      bit.style.setProperty("--size", randomBetween(14, 30) + "px");
      bit.style.setProperty("--dx", Math.cos(angle) * reach + "px");
      bit.style.setProperty("--dy", Math.sin(angle) * reach + "px");
      bit.style.setProperty("--spin", randomBetween(-200, 200) + "deg");
      bit.addEventListener("animationend", () => bit.remove());
      box.appendChild(bit);
    }
  }

  function fillSky() {
    const shapes = ["♥︎", "✦︎", "♡︎", "✧︎"];
    const sky = $("sky");
    for (let i = 0; i < 26; i++) {
      const isPetal = i % 2 === 0;
      const float = document.createElement("span");
      const time = isPetal ? randomBetween(11, 22) : randomBetween(18, 34);
      float.className = isPetal ? "petal" : "float";
      if (!isPetal) float.textContent = shapes[i % shapes.length];
      float.style.setProperty("--x", randomBetween(0, 104) + "%");
      float.style.setProperty("--y", randomBetween(0, 94) + "%");
      float.style.setProperty("--size", randomBetween(10, isPetal ? 20 : 26) + "px");
      float.style.setProperty("--alpha", randomBetween(0.3, 0.8));
      float.style.setProperty("--time", time + "s");
      float.style.setProperty("--delay", -randomBetween(0, time) + "s");
      sky.appendChild(float);
    }
  }

  function setupParallax() {
    if (calm) return;
    $("stage").addEventListener("pointermove", (event) => {
      $("stage").style.setProperty("--px", (0.5 - event.clientX / window.innerWidth).toFixed(3));
      $("stage").style.setProperty("--py", (0.5 - event.clientY / window.innerHeight).toFixed(3));
    });
  }

  /* ---------- Hang ---------- */

  // Halk, kódból készülő háttérzúgás. Csak akkor szól, ha épp nincs betöltött zene.
  function setupAmbience() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let context = null;
    let master = null;
    let wanted = false;

    function chime() {
      const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      const osc = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      osc.type = "sine";
      osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + 3.7);
    }

    function start() {
      if (!AudioContext || context) return;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 560;
      filter.connect(master);
      master.connect(context.destination);
      [110, 164.81, 220.6, 277.18].forEach((frequency, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const wobble = context.createOscillator();
        const depth = context.createGain();
        osc.type = "triangle";
        osc.frequency.value = frequency;
        gain.gain.value = 0.05;
        wobble.frequency.value = 0.07 + index * 0.031;
        depth.gain.value = 0.035;
        wobble.connect(depth).connect(gain.gain);
        osc.connect(gain).connect(filter);
        osc.start();
        wobble.start();
      });
      setInterval(() => {
        if (wanted && soundOn && Math.random() < 0.6) chime();
      }, 4200);
      apply();
    }

    function apply() {
      if (!context) return;
      const level = wanted && soundOn ? 0.55 : 0;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(level, context.currentTime, 1.4);
    }

    return {
      start,
      set(on) {
        wanted = on;
        apply();
      },
      refresh: apply,
    };
  }

  // A szint saját zenéje, ha nincs neki, akkor a közös zene.
  // A "quiet" szinten semmi sem szól.
  function trackFor(index) {
    const level = levels[index];
    if (level && level.quiet) return "";
    return (level && level.music) || GAME.music || "";
  }

  function setupMusic() {
    const audio = new Audio();
    const delay = (GAME.musicDelay || 0) * 1000;
    let track = "";
    let timer = null;

    audio.volume = MUSIC_VOLUME;

    const tryPlay = () => audio.play().then(stopListening).catch(() => {});

    function cancelWait() {
      clearTimeout(timer);
      timer = null;
    }

    function playAfterDelay() {
      cancelWait();
      if (track) {
        timer = setTimeout(() => {
          timer = null;
          tryPlay();
        }, delay);
      }
    }

    function stopListening() {
      document.removeEventListener("click", startOnFirstInput);
      document.removeEventListener("keydown", startOnFirstInput);
    }

    // A böngészők általában csak felhasználói művelet után engedik a hangot.
    function startOnFirstInput() {
      if (!track || timer !== null) return;
      tryPlay();
    }

    audio.addEventListener("error", () => {
      cancelWait();
      ambience.set(!quietLevel());
    });
    audio.addEventListener("canplay", () => ambience.set(false));
    audio.addEventListener("ended", playAfterDelay);

    document.addEventListener("click", startOnFirstInput);
    document.addEventListener("keydown", startOnFirstInput);

    return {
      muted(on) {
        audio.muted = on;
      },
      setTrack(next) {
        if (next === track) {
          if (!track) ambience.set(!quietLevel());
          return;
        }
        track = next;
        if (track) {
          audio.src = track;
        } else {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
          ambience.set(!quietLevel());
        }
        playAfterDelay();
      },
    };
  }

  function quietLevel() {
    const level = levels[current];
    return Boolean(level && level.quiet);
  }

  function renderSound() {
    $("sound").textContent = soundOn ? texts.soundOn || "" : texts.soundOff || "";
    $("sound").setAttribute("aria-pressed", String(soundOn));
    music.muted(!soundOn);
    ambience.refresh();
  }

  function toggleSound() {
    soundOn = !soundOn;
    save(SOUND_KEY, soundOn ? "on" : "off");
    renderSound();
  }

  /* ---------- Indítás ---------- */

  function setTrack(next) {
    music.setTrack(next);
  }

  function setupTexts() {
    document.title = GAME.title || document.title;
    $("title").textContent = GAME.title || "";
    $("hint-label").textContent = texts.hint || "";
    $("answer").placeholder = texts.placeholder || "";
    $("answer").setAttribute("aria-label", texts.placeholder || "");
    $("submit").textContent = texts.submit || "";
    $("restart").textContent = texts.restart || "";
    $("enter").textContent = texts.enter || "";
    $("win-title").textContent = GAME.winTitle || "";
    $("win-text").textContent = GAME.winText || "";
  }

  function setupWelcome() {
    const pairs = [
      { x: "36%", y: "2%", w: "28%", at: "0.5s" },
      { x: "4%", y: "42%", w: "24%", at: "1.2s" },
      { x: "72%", y: "48%", w: "24%", at: "1.8s" },
    ];
    const ids = Object.keys(people);
    const eyes = $("welcome-eyes");
    pairs.forEach((pair, index) => {
      const person = people[ids[index % ids.length]];
      const color = person ? person.eyes[0] : "#ff8cc6";
      eyes.insertAdjacentHTML("beforeend", ART.eyes(color));
      const element = eyes.lastElementChild;
      element.style.setProperty("--x", pair.x);
      element.style.setProperty("--y", pair.y);
      element.style.setProperty("--w", pair.w);
      element.style.setProperty("--at", pair.at);
      element.style.setProperty("--eye", color);
    });

    // A szavak egyesével tűnnek elő, a macskaarc pedig nem törhet ketté.
    const heading = $("welcome-text");
    const words = String(GAME.welcome || "").split(/\s+/).filter(Boolean);
    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "welcome-word" + (/[^\p{Script=Latin}\p{P}]/u.test(word) ? " kaomoji" : "");
      span.textContent = word;
      span.style.setProperty("--at", 2.2 + index * 0.42 + "s");
      heading.append(span, " ");
    });
    heading.setAttribute("aria-label", GAME.welcome || "");
  }

  function enterGame(level) {
    const welcome = $("welcome");
    if (welcome.classList.contains("leaving")) return;
    current = level;
    watchAccess();
    ambience.start();
    welcome.classList.add("leaving");
    setTimeout(() => {
      welcome.hidden = true;
    }, 900);

    // Az elejéről indulva a prológus jön, folytatásnál rögtön a szint.
    const start = () => {
      if (current === 0 && GAME.intro && GAME.intro.length) {
        renderProgress();
        music.setTrack("");
        $("chapter-label").textContent = texts.prologue || "";
        setBackground(GAME.introBg || "gate");
        startStory(GAME.intro, renderLevel);
      } else {
        renderLevel();
      }
    };

    setTimeout(() => {
      $("stage").hidden = false;
      $("stage").classList.add("opening");
      start();
      setTimeout(() => $("stage").classList.remove("opening"), 2300);
    }, 500);
  }

  // Csak félbehagyott játék folytatható. A szintek száma szerkesztés után csökkenhetett,
  // ezért a tartományon kívüli mentett érték nem számít.
  function savedLevel() {
    const saved = parseInt(load(LEVEL_KEY), 10);
    return saved > 0 && saved < levels.length ? saved : 0;
  }

  // A belépés mindig az elejéről indul, a mentett állás külön gombbal folytatható.
  function setupEntry() {
    const resume = savedLevel();
    $("enter").addEventListener("click", () => enterGame(0));
    if (!resume) return;
    $("resume").textContent = [texts.resume, chapterNumber(resume)].filter(Boolean).join(": ");
    $("resume").hidden = false;
    $("resume").addEventListener("click", () => enterGame(resume));
  }

  const ambience = setupAmbience();
  const music = setupMusic();
  soundOn = load(SOUND_KEY) !== "off";

  setupTexts();
  setupWelcome();
  fillSky();
  setupParallax();
  renderSound();
  $("form").addEventListener("submit", handleSubmit);
  $("restart").addEventListener("click", () => {
    $("win").hidden = true;
    goTo(0);
  });
  setupEntry();
  $("sound").addEventListener("click", toggleSound);
  $("stage").addEventListener("click", handleStageClick);
  document.addEventListener("keydown", handleKey);
  $("enter").focus({ preventScroll: true });
})();
