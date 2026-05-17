import net from "node:net";

const PORT = Number(process.env.PORT ?? 3000);

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, "127.0.0.1");
  });
}

const inUse = await isPortInUse(PORT);

if (inUse) {
  console.warn(
    `\n⚠ Port ${PORT} is already in use. Another Next.js dev server may be running.`,
  );
  console.warn(
    "  Stop the other process (close extra terminals or run: taskkill /F /IM node.exe)",
  );
  console.warn(
    "  Use one browser tab for localhost — avoid IDE Simple Browser + Chrome at once.\n",
  );
}
