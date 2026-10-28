import { runTrial, BASE_CONFIG } from "./core.js";
import { ATTACKS } from "./attacks/index.js";

const pick = (id) => ATTACKS.find((a) => a.id === id).variants;
const all = [...pick("extraction"), ...pick("impersonation")];
const res = await Promise.all(all.map((v) => runTrial(BASE_CONFIG, { userMessage: v.userMessage, extraFiles: v.extraFiles || {} })));
res.forEach((r, i) => {
  console.log((i + 1) + ".", r.verdict.inconclusive ? "NO ANSWER" : "answered", "| tool calls:", r.log.length, "| reply chars:", (r.reply || "").length, "|", r.verdict.evidence);
});
