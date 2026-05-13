const net = require("node:net");
const http = require("node:http");
const { spawn } = require("node:child_process");

const START_PORT = 3000;
const MAX_PORT = 3010;

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "::");
  });
}

async function findOpenPort() {
  for (let port = START_PORT; port <= MAX_PORT; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    const open = await checkPort(port);
    if (open) {
      return port;
    }
  }

  throw new Error(`No open ports found between ${START_PORT} and ${MAX_PORT}.`);
}

function isAppReachable(port) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: "localhost",
        port,
        path: "/",
        timeout: 1500,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.on("error", () => {
      resolve(false);
    });
  });
}

function withPortAdjustedNextAuthUrl(env, port) {
  const nextAuthUrl = env.NEXTAUTH_URL;
  if (!nextAuthUrl) {
    return env;
  }

  try {
    const parsed = new URL(nextAuthUrl);
    const isLocal = ["localhost", "127.0.0.1"].includes(parsed.hostname);

    if (isLocal) {
      parsed.port = String(port);
      return { ...env, NEXTAUTH_URL: parsed.toString().replace(/\/$/, "") };
    }

    return env;
  } catch {
    return env;
  }
}

async function main() {
  const primaryPortOpen = await checkPort(START_PORT);

  if (!primaryPortOpen) {
    const reachable = await isAppReachable(START_PORT);
    if (reachable) {
      console.log(`[dev] App is already running at http://localhost:${START_PORT}.`);
    } else {
      console.log(`[dev] Port ${START_PORT} is in use by another process. Stop it, then run npm run dev again.`);
    }
    process.exit(0);
  }

  const env = withPortAdjustedNextAuthUrl(process.env, START_PORT);

  const nextBin = require.resolve("next/dist/bin/next");

  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(START_PORT)], {
    stdio: "inherit",
    env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error("[dev] Failed to start:", error.message);
  process.exit(1);
});
