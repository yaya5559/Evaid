const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);
const counterFile = path.join(__dirname, "cypress", "counter.json");
const testEnvFile = path.join(__dirname, "cypress", "test-env.json");
const logFile = path.join(__dirname, "cypress", "test-data.txt");

module.exports = defineConfig({
  projectId: "62qqf2",

  // Azure SQL can be slow — give every command and request more time
  defaultCommandTimeout: 15000,
  requestTimeout:        15000,
  responseTimeout:       30000,

  e2e: {
    baseUrl: "http://localhost:5173",

    setupNodeEvents(on) {
      // ── Start Docker before any tests run ─────────────────────────────────
      on("before:run", async () => {
        console.log("\n🐳  Starting Docker services...");
        try {
          await execAsync("docker-compose up -d", { cwd: __dirname });
          console.log("✅  Docker services started. Waiting 15s for readiness...");
          await new Promise((resolve) => setTimeout(resolve, 15000));
        } catch (e) {
          console.error("⚠️  docker-compose error (services may already be running):", e.message);
        }
      });

      on("task", {
        // ── Counter management ────────────────────────────────────────────────
        getNextCounter() {
          if (!fs.existsSync(counterFile)) {
            fs.writeFileSync(counterFile, JSON.stringify({ count: 10 }));
          }
          const { count } = JSON.parse(fs.readFileSync(counterFile, "utf8"));
          return count;
        },

        incrementCounter() {
          let data = { count: 10 };
          if (fs.existsSync(counterFile)) {
            data = JSON.parse(fs.readFileSync(counterFile, "utf8"));
          }
          data.count += 1;
          fs.writeFileSync(counterFile, JSON.stringify(data));
          return data.count;
        },

        // ── Test environment storage (shared across spec files) ──────────────
        setTestEnv(data) {
          fs.writeFileSync(testEnvFile, JSON.stringify(data, null, 2));
          return null;
        },

        getTestEnv() {
          if (!fs.existsSync(testEnvFile)) return null;
          try {
            return JSON.parse(fs.readFileSync(testEnvFile, "utf8"));
          } catch {
            return null;
          }
        },

        clearTestEnv() {
          if (fs.existsSync(testEnvFile)) fs.unlinkSync(testEnvFile);
          return null;
        },

        // ── Test run log ──────────────────────────────────────────────────────
        logTestRun({ count, org, agent }) {
          const timestamp = new Date().toISOString();
          const entry = [
            "",
            "============================================================",
            `  RUN #${count} — ${timestamp}`,
            "============================================================",
            "",
            "  ORGANIZATION",
            "------------------------------------------------------------",
            `Organization Name:         ${org.name}`,
            `Organization Email:        ${org.email}`,
            `Organization Phone Number: ${org.phone}`,
            `Owner First Name:          ${org.ownerFirstName}`,
            `Owner Last Name:           ${org.ownerLastName}`,
            `Owner Email:               ${org.ownerEmail}`,
            `Owner Phone Number:        ${org.ownerPhone}`,
            `Password:                  ${org.password}`,
            "",
            "  AGENT",
            "------------------------------------------------------------",
            `First Name:   ${agent.firstName}`,
            `Last Name:    ${agent.lastName}`,
            `Email:        ${agent.email}`,
            `Phone Number: ${agent.phone}`,
            `Organization: ${org.name}`,
            `Password:     ${agent.password}`,
            "",
          ].join("\n");
          fs.appendFileSync(logFile, entry);
          return null;
        },
      });
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});