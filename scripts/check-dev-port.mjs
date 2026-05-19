import net from "node:net";
import { execSync } from "node:child_process";
import { platform } from "node:os";

const PORT = Number(process.env.PORT ?? 3000);

/** PID with a LISTENING socket on `port` (netstat on Windows, ss on Linux). */
function findListeningPid(port) {
  if (platform() === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        // Avoid false positives (e.g. :30000 matching :3000)
        if (!line.includes(`:${port}`)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid) && pid !== "0") return pid;
      }
    } catch {
      /* no match */
    }
    return null;
  }

  try {
    const out = execSync(`ss -ltnp 'sport = :${port}'`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const match = out.match(/pid=(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function isPortInUse(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, host);
  });
}

const ownerPid = findListeningPid(PORT);
// Bind probe is unreliable on Windows when IPv6 holds the port; use netstat first.
const inUseByBind =
  !ownerPid &&
  ((await isPortInUse(PORT, "127.0.0.1")) || (await isPortInUse(PORT, "::")));
const inUse = Boolean(ownerPid) || inUseByBind;

if (inUse) {
  console.error(
    `\n✖ Port ${PORT} is already in use. Stop the existing dev server before starting another.`,
  );
  if (ownerPid) {
    console.error(`  Process holding port ${PORT}: PID ${ownerPid}`);
    if (platform() === "win32") {
      console.error(`  Run: taskkill /PID ${ownerPid} /F\n`);
    } else {
      console.error(`  Run: kill ${ownerPid}\n`);
    }
  } else {
    console.error(
      "  Close other terminals running npm run dev, or free the port manually.\n",
    );
  }
  process.exit(1);
}
