import "dotenv/config";
import OpenAI from "openai";

export const client = new OpenAI({
  baseURL: "https://api.tokenfactory.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

export const MODELS = {
  fast: process.env.NEBIUS_MODEL_FAST,
  reasoning: process.env.NEBIUS_MODEL_REASONING,
};

export async function ask(modelKey, messages, opts = {}) {
  const res = await client.chat.completions.create({
    model: MODELS[modelKey],
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.max_tokens ?? 800,
  });
  return res.choices[0].message.content || "";
}
