import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.tokenfactory.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

const ids = [];
for await (const m of await client.models.list()) ids.push(m.id);

const found = ids.filter((id) => /nemotron|nvidia/i.test(id));
console.log(found.length ? found.join("\n") : "No Nemotron model found. Total models: " + ids.length);
