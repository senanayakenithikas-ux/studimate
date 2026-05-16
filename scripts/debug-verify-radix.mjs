import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";

const ENDPOINT =
  "http://127.0.0.1:7571/ingest/194d7113-fc03-43c9-a6df-3c5e79441369";
const SESSION = "8f67e8";
const runId = process.env.DEBUG_RUN_ID ?? "pre-fix";

const nestedPath =
  "node_modules/@radix-ui/react-avatar/node_modules/@radix-ui/react-context/dist/index.mjs";
const hoistedPath =
  "node_modules/@radix-ui/react-context/dist/index.mjs";

const data = {
  nestedPathExists: existsSync(nestedPath),
  hoistedPathExists: existsSync(hoistedPath),
  reactAvatarHasNodeModules: existsSync(
    "node_modules/@radix-ui/react-avatar/node_modules",
  ),
  hasPackageLock: existsSync("package-lock.json"),
  hasPnpmLock: existsSync("pnpm-lock.yaml"),
  hasNpmrc: existsSync(".npmrc"),
};

function log(hypothesisId, message) {
  const payload = {
    sessionId: SESSION,
    runId,
    hypothesisId,
    location: "scripts/debug-verify-radix.mjs",
    message,
    data,
    timestamp: Date.now(),
  };
  return fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

await log(
  "A",
  "nested vs hoisted react-context paths (mixed PM / stale layout)",
);
await log("B", "package-lock expects nested; pnpm hoists — check locks");
await log("C", "react-avatar nested node_modules folder presence");

console.log(JSON.stringify(data, null, 2));
