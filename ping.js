import { ask, MODELS } from "./llm.js";

async function t(key) {
  const s = Date.now();
  try {
    const r = await ask(key, [{ role: "user", content: "Reply with the single word OK." }], { max_tokens: key === "reasoning" ? 400 : 30 });
    console.log(key, "(" + MODELS[key] + ") OK in", Date.now() - s, "ms:", JSON.stringify(r.slice(0, 40)));
  } catch (e) {
    console.log(key, "FAILED after", Date.now() - s, "ms:", e.status || "", e.message);
  }
}
await t("fast");
await t("reasoning");
