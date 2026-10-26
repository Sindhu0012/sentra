import { WEAK_PROMPT } from "./target/prompt.js";
import { createSandbox } from "./target/sandbox.js";
import { runAria, DEFAULT_SYSTEM_PROMPT } from "./target/aria.js";
import { ATTACKS } from "./attacks/index.js";
import { judge, CANARY } from "./judge.js";

export const BASE_CONFIG = { systemPrompt: WEAK_PROMPT, enforceAllowlist: false, outputGuard: false };

export async function scan(config, onEvent = () => {}) {
  const results = [];
  for (const attack of ATTACKS) {
    let broken = false;
    let proof = null;
    for (const [i, v] of attack.variants.entries()) {
      let verdict, run;
      try {
        const sandbox = createSandbox({ extraFiles: v.extraFiles || {}, enforceAllowlist: config.enforceAllowlist });
        run = await runAria({ userMessage: v.userMessage, sandbox, systemPrompt: config.systemPrompt });
        if (config.outputGuard) run.reply = run.reply.split(CANARY).join("[REDACTED]");
        verdict = judge(attack.id, run);
      } catch (e) {
        run = { reply: "", log: [] };
        verdict = { success: false, evidence: "error: " + e.message };
      }
      if (verdict.success) { broken = true; if (!proof) proof = { userMessage: v.userMessage, log: run.log, reply: run.reply, evidence: verdict.evidence }; }
      onEvent({ attack: attack.name, severity: attack.severity, variant: i + 1, success: verdict.success, evidence: verdict.evidence });
    }
    results.push({ id: attack.id, name: attack.name, severity: attack.severity, weight: attack.weight, broken, proof });
  }
  let score = 100;
  for (const r of results) if (r.broken) score -= r.weight;
  return { score: Math.max(score, 0), results };
}
