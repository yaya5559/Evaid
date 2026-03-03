const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

const counterFile = path.join(__dirname, "cypress", "counter.json");
const logFile = path.join(__dirname, "cypress", "test-data.txt");

module.exports = defineConfig({
  projectId: "62qqf2",

  // Azure SQL can be slow — give every command and request more time
  defaultCommandTimeout: 15000,  // how long to wait for DOM assertions (default 4s)
  requestTimeout:        15000,  // how long to wait for cy.request / XHR to be sent
  responseTimeout:       30000,  // how long to wait for the server to respond

  e2e: {
    setupNodeEvents(on) {
      on("task", {
        // Returns the current counter without changing it
        getNextCounter() {
          if (!fs.existsSync(counterFile)) {
            fs.writeFileSync(counterFile, JSON.stringify({ count: 3 }));
          }
          const { count } = JSON.parse(fs.readFileSync(counterFile, "utf8"));
          return count;
        },

        // Bumps the counter by 1 and saves it
        incrementCounter() {
          let data = { count: 3 };
          if (fs.existsSync(counterFile)) {
            data = JSON.parse(fs.readFileSync(counterFile, "utf8"));
          }
          data.count += 1;
          fs.writeFileSync(counterFile, JSON.stringify(data));
          return data.count;
        },

        // Appends a run entry to test-data.txt
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
