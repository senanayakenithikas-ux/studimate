import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const apiKey = process.env.MINIMAX_API_KEY?.trim();
const groupId = process.env.MINIMAX_GROUP_ID?.trim();
const model = process.env.MINIMAX_MODEL?.trim() || "MiniMax-M2.7";
const apiUrl =
  process.env.MINIMAX_API_URL?.trim() ||
  "https://api.minimax.io/v1/text/chatcompletion_v2";

if (!apiKey) {
  console.error("MINIMAX_API_KEY missing in .env.local");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
};
if (groupId) headers["Group-Id"] = groupId;

const res = await fetch(apiUrl, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model,
    messages: [{ role: "user", content: "Reply with exactly: OK" }],
    max_completion_tokens: 32,
  }),
});

const data = await res.json();
const code = data.base_resp?.status_code;
const msg = data.base_resp?.status_msg;
console.log("HTTP", res.status, "base_resp", code, msg);
if (code === 0) {
  console.log("content:", data.choices?.[0]?.message?.content?.slice(0, 80));
  process.exit(0);
}
process.exit(1);
