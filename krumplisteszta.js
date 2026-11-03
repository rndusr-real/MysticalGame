(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  const levels = typeof GAME === "undefined" ? [] : GAME.levels || [];
  const accessUrl = typeof GAME === "undefined" ? "" : GAME.accessUrl;

  // Az adatbázisban a lezárt fejezetek szerepelnek: { c1: true, c4: true }. A sorszám 1-től indul.
  let locked = new Set();
  let saving = Promise.resolve();

  function setStatus(message) {
    $("status").textContent = message;
  }

  function chapterKey(index) {
    return "c" + (index + 1);
  }

  function applyData(data) {
    locked = new Set(Object.keys(data || {}).filter((key) => data[key] === true));
  }

  async function loadLocked() {
    const response = await fetch(accessUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("load");
    applyData(await response.json());
  }

  // A mentések sorban futnak, hogy a gyors kattintások ne előzzék meg egymást.
  function saveLocked() {
    saving = saving.then(async () => {
      const data = {};
      locked.forEach((key) => {
        data[key] = true;
      });
      try {
        const response = await fetch(accessUrl, {
          method: "PUT",
          body: JSON.stringify(locked.size ? data : null),
        });
        if (!response.ok) throw new Error("save");
        setStatus("");
      } catch (error) {
        setStatus("Nem sikerült menteni, ezért a kapcsolók a mentett állást mutatják. Próbáld újra.");
        await loadLocked().catch(() => {});
        renderLevels();
      }
    });
  }

  function renderLevels() {
    const list = $("levels");
    list.replaceChildren();
    levels.forEach((level, index) => {
      const key = chapterKey(index);
      const isLocked = locked.has(key);
      const item = document.createElement("li");
      const label = document.createElement("label");
      const roman = document.createElement("span");
      const name = document.createElement("span");
      const state = document.createElement("span");
      const box = document.createElement("input");

      label.className = "level" + (isLocked ? " is-locked" : "");
      roman.className = "level-number";
      roman.textContent = (ROMAN[index] || index + 1) + ".";
      name.className = "level-name";
      name.textContent = level.chapter || index + 1 + ". szint";
      state.className = "level-state";
      state.textContent = isLocked ? "Zárva" : "Nyitva";
      box.className = "switch";
      box.type = "checkbox";
      box.checked = !isLocked;
      box.addEventListener("change", () => {
        if (box.checked) locked.delete(key);
        else locked.add(key);
        saveLocked();
        renderLevels();
        list.querySelectorAll(".switch")[index].focus();
      });

      label.append(roman, name, state, box);
      item.appendChild(label);
      list.appendChild(item);
    });
  }

  function setAll(lockAll) {
    locked = new Set(lockAll ? levels.map((_, index) => chapterKey(index)) : []);
    saveLocked();
    renderLevels();
  }

  $("open-all").addEventListener("click", () => setAll(false));
  $("lock-all").addEventListener("click", () => setAll(true));

  // Sikertelen betöltésnél nincs kapcsoló, így nem lehet véletlenül felülírni a mentett állást.
  loadLocked().then(renderLevels).catch(() => {
    setStatus("Nem sikerült betölteni a beállításokat. Töltsd újra az oldalt.");
  });
})();
