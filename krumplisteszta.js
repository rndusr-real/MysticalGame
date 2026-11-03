(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const ACCESS_URL = "api/access";
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  const levels = typeof GAME === "undefined" ? [] : GAME.levels || [];

  // A sorszámok 1-től indulnak, ugyanúgy, ahogy a játék fejezetei.
  let locked = new Set();
  let savedText = "[]";
  let busy = false;

  function setStatus(message, bad) {
    $("status").textContent = message;
    $("status").classList.toggle("bad", Boolean(bad));
  }

  function lockedText() {
    return JSON.stringify(Array.from(locked).sort((a, b) => a - b));
  }

  function renderSave() {
    $("save").disabled = busy || lockedText() === savedText;
  }

  function renderLevels() {
    const list = $("levels");
    list.replaceChildren();
    levels.forEach((level, index) => {
      const number = index + 1;
      const isLocked = locked.has(number);
      const item = document.createElement("li");
      const label = document.createElement("label");
      const roman = document.createElement("span");
      const name = document.createElement("span");
      const state = document.createElement("span");
      const box = document.createElement("input");

      label.className = "level" + (isLocked ? " is-locked" : "");
      roman.className = "level-number";
      roman.textContent = (ROMAN[index] || number) + ".";
      name.className = "level-name";
      name.textContent = level.chapter || number + ". szint";
      state.className = "level-state";
      state.textContent = isLocked ? "Zárva" : "Nyitva";
      box.className = "switch";
      box.type = "checkbox";
      box.checked = !isLocked;
      box.addEventListener("change", () => {
        if (box.checked) locked.delete(number);
        else locked.add(number);
        setStatus("");
        renderLevels();
        renderSave();
        list.querySelectorAll(".switch")[index].focus();
      });

      label.append(roman, name, state, box);
      item.appendChild(label);
      list.appendChild(item);
    });
  }

  function setAll(lockAll) {
    locked = new Set(lockAll ? levels.map((_, index) => index + 1) : []);
    setStatus("");
    renderLevels();
    renderSave();
  }

  function applyLocked(list) {
    locked = new Set(list);
    savedText = lockedText();
    renderLevels();
    renderSave();
  }

  function explain(status) {
    if (status === 503) return "Még nincs tároló a Vercel projekthez kötve, ezért nem lehet menteni.";
    if (status === 404 || status === 405) return "Ez csak a Vercelen futó oldalon működik.";
    return "Nem sikerült elérni a tárolót. Próbáld újra.";
  }

  async function loadLocked() {
    try {
      const response = await fetch(ACCESS_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(explain(response.status));
      applyLocked((await response.json()).locked);
    } catch (error) {
      setStatus(error.message || "Nem sikerült elérni a szervert. Próbáld újra.", true);
    }
  }

  async function saveLocked() {
    busy = true;
    renderSave();
    setStatus("Mentés...");
    try {
      const response = await fetch(ACCESS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: JSON.parse(lockedText()) }),
      });
      if (!response.ok) throw new Error(explain(response.status));
      applyLocked((await response.json()).locked);
      setStatus("Elmentve. Legfeljebb 15 másodpercen belül érvényes a játékban.");
    } catch (error) {
      setStatus(error.message || "Nem sikerült elérni a szervert. Próbáld újra.", true);
    }
    busy = false;
    renderSave();
  }

  $("open-all").addEventListener("click", () => setAll(false));
  $("lock-all").addEventListener("click", () => setAll(true));
  $("save").addEventListener("click", saveLocked);

  renderLevels();
  loadLocked();
})();
