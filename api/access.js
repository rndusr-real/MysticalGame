// A fejezetek hozzáférhetősége. A játék olvassa, a krumplisteszta.html írja.
// Az adat egy Upstash Redis tárolóban van, amit a Vercel projekthez kell kötni.

const KEY = "locked-levels";
const MAX_LEVEL = 100;

function storeConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(store, command) {
  const response = await fetch(store.url, {
    method: "POST",
    headers: { Authorization: "Bearer " + store.token, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error("A tároló hibát adott: " + response.status);
  return (await response.json()).result;
}

async function readLocked(store) {
  const stored = await redis(store, ["GET", KEY]);
  return stored ? JSON.parse(stored) : [];
}

function cleanLocked(list) {
  if (!Array.isArray(list)) return null;
  const numbers = list.filter((number) => Number.isInteger(number) && number >= 1 && number <= MAX_LEVEL);
  return numbers.length === list.length ? Array.from(new Set(numbers)).sort((a, b) => a - b) : null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const store = storeConfig();

  // Ha nincs tároló, vagy hibázik, minden nyitva marad, hogy a játék ne akadjon el.
  if (req.method === "GET") {
    try {
      res.status(200).json({ locked: store ? await readLocked(store) : [] });
    } catch (error) {
      res.status(200).json({ locked: [] });
    }
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "method" });
    return;
  }

  if (!store) {
    res.status(503).json({ error: "no-store" });
    return;
  }
  const locked = cleanLocked((req.body || {}).locked);
  if (!locked) {
    res.status(400).json({ error: "list" });
    return;
  }
  try {
    await redis(store, ["SET", KEY, JSON.stringify(locked)]);
    res.status(200).json({ locked });
  } catch (error) {
    res.status(502).json({ error: "store" });
  }
};
