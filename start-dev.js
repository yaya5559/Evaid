/**
 * Starts the backend (with venv) and frontend concurrently.
 * Works on both Windows and macOS/Linux.
 *
 * Usage:
 *   node start-dev.js
 *   npm run dev
 */

const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const ROOT     = __dirname;
const BACKEND  = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");

const isWin = os.platform() === "win32";
const UVICORN = isWin
  ? path.join(BACKEND, "venv", "Scripts", "uvicorn.exe")
  : path.join(BACKEND, "venv", "bin", "uvicorn");

function start(label, color, cmdString, cwd, extraEnv = {}) {
  const RESET = "\x1b[0m";
  const prefix = `${color}[${label}]${RESET} `;

  console.log(`${prefix}starting...`);

  let proc;
  if (isWin) {
    // PowerShell handles paths with spaces reliably
    proc = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmdString], {
      cwd,
      stdio: "pipe",
      env: { ...process.env, ...extraEnv },
    });
  } else {
    proc = spawn("sh", ["-c", cmdString], {
      cwd,
      stdio: "pipe",
      env: { ...process.env, ...extraEnv },
    });
  }

  proc.stdout.on("data", (d) =>
    d.toString().split("\n").filter(Boolean).forEach((line) => process.stdout.write(`${prefix}${line}\n`))
  );
  proc.stderr.on("data", (d) =>
    d.toString().split("\n").filter(Boolean).forEach((line) => process.stderr.write(`${prefix}${line}\n`))
  );
  proc.on("error", (e) => console.error(`${prefix}error: ${e.message}`));
  return proc;
}

function killTree(proc, label) {
  if (!proc || proc.exitCode !== null) return;
  console.log(`[${label}] stopping...`);
  if (isWin) {
    spawn("taskkill", ["/pid", String(proc.pid), "/f", "/t"], { stdio: "ignore" });
  } else {
    proc.kill("SIGTERM");
  }
}

const CYAN   = "\x1b[36m";
const YELLOW = "\x1b[33m";

// PowerShell uses & to invoke executables; quotes handle paths with spaces
const backendCmd  = isWin ? `& "${UVICORN}" main:app --reload` : `"${UVICORN}" main:app --reload`;
const frontendCmd = "npm run dev";

const backend  = start("backend",  YELLOW, backendCmd,  BACKEND,  { PYTHONUTF8: "1" });
const frontend = start("frontend", CYAN,   frontendCmd, FRONTEND);

function cleanup() {
  killTree(backend,  "backend");
  killTree(frontend, "frontend");
}

process.on("SIGINT",  cleanup);
process.on("SIGTERM", cleanup);

backend.on("close",  (code) => { if (code !== 0) { console.error(`[backend] exited with code ${code}`);  cleanup(); process.exit(code); } });
frontend.on("close", (code) => { if (code !== 0) { console.error(`[frontend] exited with code ${code}`); cleanup(); process.exit(code); } });
