(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const ACCESS_FILE = "access-settings.json";
  const HANDLE_DB = "krumplisteszta";
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  // A jelszó nincs a kódban, csak a lenyomata.
  const PASSWORD = {
    salt: "b1V6zTUP7oYT6onRXqKi7g==",
    rounds: 600000,
    hash: "vidcfh/SIPFFEVrEVdS6KVXq4my6X1J+YyxjClu0sXY=",
  };

  const levels = typeof GAME === "undefined" ? [] : GAME.levels || [];

  // A sorszámok 1-től indulnak, ugyanúgy, ahogy a játék fejezetei.
  let locked = new Set();
  let savedText = "[]";
  let busy = false;
  let fileHandle = null;
  const canSave = "showOpenFilePicker" in window;

  function setStatus(message, bad) {
    $("status").textContent = message;
    $("status").classList.toggle("bad", Boolean(bad));
  }

  function lockedText() {
    return JSON.stringify(Array.from(locked).sort((a, b) => a - b));
  }

  function renderSave() {
    $("save").disabled = busy || !canSave || lockedText() === savedText;
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

  /* ---------- Jelszó ---------- */

  async function isPasswordRight(password) {
    const salt = Uint8Array.from(atob(PASSWORD.salt), (letter) => letter.charCodeAt(0));
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password.normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD.rounds }, material, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits))) === PASSWORD.hash;
  }

  async function handleLogin(event) {
    event.preventDefault();
    $("login-status").textContent = "";
    $("login-button").disabled = true;
    if (await isPasswordRight($("password").value)) {
      $("password").value = "";
      $("login").hidden = true;
      $("admin").hidden = false;
      loadLocked();
    } else {
      $("login-status").textContent = "Hibás jelszó.";
      $("password").select();
    }
    $("login-button").disabled = false;
  }

  /* ---------- Fájl ---------- */

  // A helyi fájl az újabb, ha már ki van választva: lehet benne még fel nem töltött változás.
  async function readSettings() {
    if (canSave) {
      fileHandle = await loadHandle().catch(() => null);
      if (fileHandle && (await hasWriteAccess().catch(() => false))) {
        return JSON.parse(await (await fileHandle.getFile()).text());
      }
    }
    const response = await fetch(ACCESS_FILE + "?t=" + Date.now(), { cache: "no-store" });
    return response.ok ? response.json() : {};
  }

  async function loadLocked() {
    try {
      const data = await readSettings();
      locked = new Set((Array.isArray(data.locked) ? data.locked : []).filter(Number.isInteger));
    } catch (error) {
      locked = new Set();
    }
    savedText = lockedText();
    renderLevels();
    renderSave();
    if (!canSave) setStatus("A mentés csak Chrome-ban és Edge-ben működik, mert csak ezek tudnak meglévő fájlba írni.", true);
  }

  // A kiválasztott fájlt a böngésző megjegyzi, így a következő alkalommal sem kell újra kiválasztani.
  function openHandleStore() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(HANDLE_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("handles");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function loadHandle() {
    const db = await openHandleStore();
    return new Promise((resolve, reject) => {
      const request = db.transaction("handles").objectStore("handles").get(ACCESS_FILE);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function storeHandle(handle) {
    const db = await openHandleStore();
    db.transaction("handles", "readwrite").objectStore("handles").put(handle, ACCESS_FILE);
  }

  async function pickFile() {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
    });
    if (handle.name !== ACCESS_FILE) throw new Error("wrong-file");
    fileHandle = handle;
    storeHandle(handle).catch(() => {});
  }

  async function hasWriteAccess() {
    return (await fileHandle.requestPermission({ mode: "readwrite" })) === "granted";
  }

  // Mindig ugyanazt a meglévő fájlt írja felül, új fájlt sosem hoz létre.
  async function writeFile(text) {
    if (!fileHandle) await pickFile();
    if (!(await hasWriteAccess())) throw new Error("no-permission");
    const stream = await fileHandle.createWritable();
    await stream.write(text);
    await stream.close();
  }

  function explainSaveError(error) {
    if (error.message === "wrong-file") return "Ez nem a jó fájl. A MysticalGame mappában lévő " + ACCESS_FILE + " fájlt válaszd ki.";
    if (error.message === "no-permission") return "A böngésző nem kapott engedélyt a fájl írására. Próbáld újra, és engedélyezd.";
    return "Nem sikerült menteni a fájlt. Próbáld újra.";
  }

  async function saveLocked() {
    const list = lockedText();
    busy = true;
    renderSave();
    setStatus("");
    try {
      await writeFile(JSON.stringify({ locked: JSON.parse(list) }, null, 2) + "\n");
      savedText = list;
      setStatus("Elmentve az " + ACCESS_FILE + " fájlba. A játékban akkor lesz érvényes, amikor ez a fájl felkerül a GitHubra.");
    } catch (error) {
      if (error.name !== "AbortError") setStatus(explainSaveError(error), true);
    }
    busy = false;
    renderSave();
  }

  $("login-form").addEventListener("submit", handleLogin);
  $("open-all").addEventListener("click", () => setAll(false));
  $("lock-all").addEventListener("click", () => setAll(true));
  $("save").addEventListener("click", saveLocked);
})();
