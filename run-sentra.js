import { scan, BASE_CONFIG } from "./core.js";
import { explain } from "./explainer.js";
import { patch } from "./patcher.js";

const log = (e) => console.log("  " + e.attack + " v" + e.variant + ": " + (e.success ? "BROKE" : "held") + " - " + e.evidence);

console.log("=== SCAN 1: original agent ===");
const before = await scan(BASE_CONFIG, log);
console.log("SCORE BEFORE: " + before.score + "/100");

const broken = before.results.filter((r) => r.broken);
for (const r of broken) { r.explanation = await explain(r); console.log("\n[" + r.severity + "] " + r.name + "\n  Why: " + r.explanation); }

if (!broken.length) { console.log("Nothing broke."); process.exit(0); }

const fixed = await patch(BASE_CONFIG, broken);
console.log("\nPATCH APPLIED:\n - " + fixed.changes.join("\n - "));

console.log("\n=== SCAN 2: patched agent, same attacks ===");
const after = await scan(fixed.config, log);
console.log("SCORE AFTER: " + after.score + "/100");
console.log("\nBEFORE " + before.score + " -> AFTER " + after.score);
