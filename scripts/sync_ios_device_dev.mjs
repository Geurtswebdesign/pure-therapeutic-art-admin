import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

function getLanIp() {
  const interfaces = networkInterfaces();
  const candidates = ["en0", "en1"];

  for (const name of candidates) {
    const entries = interfaces[name] ?? [];
    for (const entry of entries) {
      if (entry && entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry && entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

const lanIp = getLanIp();
if (!lanIp) {
  process.stderr.write(
    "Kon geen lokaal LAN IPv4-adres vinden. Verbind je Mac met wifi of ethernet.\n"
  );
  process.exit(1);
}

const port = process.env.CAPACITOR_DEV_PORT?.trim() || "3000";
const serverUrl = `http://${lanIp}:${port}`;

process.stdout.write(`Syncing iOS device build to ${serverUrl}\n`);

const child = spawn("npm", ["run", "native:sync"], {
  stdio: "inherit",
  env: {
    ...process.env,
    CAPACITOR_SERVER_URL: serverUrl,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
