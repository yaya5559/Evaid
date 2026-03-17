/**
 * Starts the backend and frontend, waits until both are ready,
 * then opens Cypress. Cleans up both servers when Cypress exits.
 *
 * Usage:
 *   node cypress-start.js          (opens Cypress UI)
 *   node cypress-start.js --run    (headless run)
 */

const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const ROOT     = __dirname;
const BACKEND  = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");
const UVICORN  = path.join(BACKEND, "venv", "Scripts", "uvicorn.exe");

const BACKEND_URL  = "http://localhost:8000";
const FRONTEND_URL = "http://localhost:5173";

const headless = process.argv.includes("--run");

// ── Helpers ──────────────────────────────────────────────────────────────────

// On Windows, run everything through cmd /c "command" to avoid spawn quoting issues
function start(label, cmdString, cwd, extraEnv = {}) {
  console.log(`[${label}] starting…`);
  const proc = spawn("cmd", ["/c", cmdString], {
    cwd,
    stdio: "pipe",
    env: { ...process.env, ...extraEnv },
  });
  proc.stdout.on("data", (d) => process.stdout.write(`[${label}] ${d}`));
  proc.stderr.on("data", (d) => process.stderr.write(`[${label}] ${d}`));
  proc.on("error", (e) => console.error(`[${label}] error: ${e.message}`));
  return proc;
}

function killTree(proc, label) {
  if (!proc || proc.exitCode !== null) return;
  console.log(`[${label}] stopping…`);
  // On Windows, taskkill kills the whole process tree (including uvicorn --reload children)
  spawn("taskkill", ["/pid", String(proc.pid), "/f", "/t"], { stdio: "ignore" });
}

function waitFor(url, label, maxSeconds = 90) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function check() {
      http.get(url, () => {
        console.log(`[${label}] ready ✓`);
        resolve();
      }).on("error", () => {
        if (++attempts >= maxSeconds) {
          reject(new Error(`[${label}] not ready after ${maxSeconds}s`));
        } else {
          setTimeout(check, 1000);
        }
      });
    }
    check();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const backend  = start("backend",  `${UVICORN} main:app --reload`, BACKEND, { PYTHONUTF8: "1" });
  const frontend = start("frontend", "npm run dev",                    FRONTEND);

  try {
    await Promise.all([
      waitFor(BACKEND_URL,  "backend"),
      waitFor(FRONTEND_URL, "frontend"),
    ]);
  } catch (err) {
    console.error(err.message);
    killTree(backend,  "backend");
    killTree(frontend, "frontend");
    process.exit(1);
  }

  console.log("\nBoth servers ready — launching Cypress…\n");

  const cypressArgs = headless ? ["cypress", "run"] : ["cypress", "open"];
  const cypress = spawn("npx", cypressArgs, { cwd: ROOT, stdio: "inherit", shell: true });

  function cleanup() {
    killTree(backend,  "backend");
    killTree(frontend, "frontend");
  }

  cypress.on("close", (code) => {
    cleanup();
    process.exit(code ?? 0);
  });

  process.on("SIGINT",  cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
