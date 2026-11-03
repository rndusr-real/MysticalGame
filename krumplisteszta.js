(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const LOCKED_KEY = "pink-puzzle:locked";
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  const levels = typeof GAME === "undefined" ? [] : GAME.levels || [];

  // A sorszámok 1-től indulnak, ugyanúgy, ahogy a játék fejezetei.
  let locked = new Set();

  // A localStorage tiltott lehet, ilyenkor a kapcsolóknak nincs hatása, és ezt ki is írja.
  function loadLocked() {
    try {
      const list = JSON.parse(localStorage.getItem(LOCKED_KEY));
      locked = new Set(Array.isArray(list) ? list.filter(Number.isInteger) : []);
    } catch (e) {
      locked = new Set();
    }
  }

  function saveLocked() {
    try {
      localStorage.setItem(LOCKED_KEY, JSON.stringify(Array.from(locked).sort((a, b) => a - b)));
      $("status").textContent = "";
    } catch (e) {
      $("status").textContent = "A böngésző nem engedi a mentést.";
    }
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
    locked = new Set(lockAll ? levels.map((_, index) => index + 1) : []);
    saveLocked();
    renderLevels();
  }

  $("open-all").addEventListener("click", () => setAll(false));
  $("lock-all").addEventListener("click", () => setAll(true));

  loadLocked();
  renderLevels();
})();
