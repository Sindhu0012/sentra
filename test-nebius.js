import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.tokenfactory.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

async function say(model, label) {
  try {
    const res = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Say hello in one short sentence." }],
      max_tokens: 300,
    });
    console.log(label, "OK:", res.choices[0].message.content);
  } catch (e) {
    console.log(label, "FAILED:", e.message);
  }
}

await say(process.env.NEBIUS_MODEL_FAST, "FAST model");
await say(process.env.NEBIUS_MODEL_REASONING, "REASONING model");

try {
  const res = await client.chat.completions.create({
    model: process.env.NEBIUS_MODEL_FAST,
    messages: [{ role: "user", content: "Send an email to bob@example.com saying hi." }],
    tools: [{
      type: "function",
      function: {
        name: "send_email",
        description: "Send an email",
        parameters: {
          type: "object",
          properties: { to: { type: "string" }, body: { type: "string" } },
          required: ["to", "body"],
        },
      },
    }],
    max_tokens: 300,
  });
  const calls = res.choices[0].message.tool_calls;
  console.log("TOOL CALLING:", calls && calls.length ? "works " + JSON.stringify(calls[0].function) : "no tool call returned");
} catch (e) {
  console.log("TOOL CALLING FAILED:", e.message);
}
