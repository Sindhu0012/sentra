import "dotenv/config";
import express from "express";
import { scan, BASE_CONFIG } from "./core.js";
import { explain } from "./explainer.js";
import { patch } from "./patcher.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.static("public"));

const store = new Map();
const hits = new Map();
let busy = false;

function allowed(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (arr.length >= 12) return false;
  arr.push(now);
  hits.set(ip, arr);
  return true;
}

function open(res) {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  return (o) => res.write("data: " + JSON.stringify(o) + "\n\n");
}

app.get("/api/scan", async (req, res) => {
  const send = open(res);
  if (busy) { send({ type: "error", text: "Another scan is running. Try again in a minute." }); return res.end(); }
  if (!allowed(req.ip)) { send({ type: "error", text: "Demo limit reached. Try again later." }); return res.end(); }
  busy = true;
  try {
    send({ type: "phase", text: "Attacking Aria (Nemotron Nano) with 9 attacks..." });
    const before = await scan(BASE_CONFIG, (e) => send({ type: "attack", stage: "before", ...e }));
    send({ type: "score", stage: "before", score: before.score });
    const broken = before.results.filter((r) => r.broken);
    send({ type: "phase", text: "Nemotron Ultra is explaining what broke..." });
    for (const r of broken) {
      r.explanation = await explain(r);
      send({ type: "explain", name: r.name, severity: r.severity, text: r.explanation });
    }
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 6);
    store.set(id, { before, broken });
    send({ type: "done", stage: "scan", id, canPatch: broken.length > 0 });
  } catch (e) {
    send({ type: "error", text: "Something failed: " + e.message });
  } finally {
    busy = false;
    res.end();
  }
});

app.get("/api/patch", async (req, res) => {
  const send = open(res);
  const saved = store.get(req.query.id);
  if (!saved) { send({ type: "error", text: "Run a scan first." }); return res.end(); }
  if (busy) { send({ type: "error", text: "Another scan is running. Try again in a minute." }); return res.end(); }
  if (!allowed(req.ip)) { send({ type: "error", text: "Demo limit reached. Try again later." }); return res.end(); }
  busy = true;
  try {
    send({ type: "phase", text: "Nemotron Ultra is patching Aria..." });
    const fixed = await patch(BASE_CONFIG, saved.broken);
    send({ type: "patch", changes: fixed.changes });
    send({ type: "phase", text: "Re-running the same 9 attacks on the patched Aria..." });
    const after = await scan(fixed.config, (e) => send({ type: "attack", stage: "after", ...e }));
    send({ type: "score", stage: "after", score: after.score });
    send({ type: "done", stage: "patch", before: saved.before.score, after: after.score });
  } catch (e) {
    send({ type: "error", text: "Something failed: " + e.message });
  } finally {
    busy = false;
    res.end();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Sentra running on http://localhost:" + port));
