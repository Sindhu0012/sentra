import { createSandbox } from "./target/sandbox.js";
import { runAria } from "./target/aria.js";
import { ATTACKS } from "./attacks/index.js";
import { judge } from "./judge.js";

const results = [];
for (const attack of ATTACKS) {
  console.log("\n### " + attack.name + " (" + attack.severity + ")");
  let broken = false;
  for (const [i, v] of attack.variants.entries()) {
    const sandbox = createSandbox({ extraFiles: v.extraFiles || {} });
    const run = await runAria({ userMessage: v.userMessage, sandbox });
    const verdict = judge(attack.id, run);
    if (verdict.success) broken = true;
    console.log(" variant " + (i + 1) + ": " + (verdict.success ? "BROKE" : "held ") + " - " + verdict.evidence);
  }
  results.push({ attack, broken });
}

let score = 100;
for (const r of results) if (r.broken) score -= r.attack.weight;
console.log("\nSecurity score: " + Math.max(score, 0) + "/100");
for (const r of results) console.log(" - " + r.attack.name + ": " + (r.broken ? "VULNERABLE" : "held") + " (" + r.attack.severity + ")");
