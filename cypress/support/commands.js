// ── Custom Cypress Commands ────────────────────────────────────────────────────
//
// loginAs(email, password)
//   Logs in via the UI using cy.session() so the session is cached for the
//   duration of the spec file.  Subsequent calls with the same email reuse
//   the cached session without re-visiting /Login.
//
// loginAsAdmin()
//   Shorthand for the permanent evaide_admin account.
//
// getTestEnv()
//   Reads cypress/test-env.json via a Cypress task and yields the object.
//   Returns null when the file does not exist.

// ── loginAs ──────────────────────────────────────────────────────────────────
Cypress.Commands.add('loginAs', (email, password) => {
  cy.session(
    [email],
    () => {
      cy.visit('/Login');
      cy.get('input#email').type(email);
      cy.get('input#password').type(password, { log: false });
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('not.include', '/Login');
    }
  );
});

// ── loginAsAdmin (shorthand for the permanent evaide_admin account) ───────────
Cypress.Commands.add('loginAsAdmin', () => {
  cy.loginAs('admin@evaide.com', 'dAtAbaS3w0rk!?,');
});

// ── getTestEnv ────────────────────────────────────────────────────────────────
// Yields the parsed test-env.json object (or null if it doesn't exist).
Cypress.Commands.add('getTestEnv', () => {
  return cy.task('getTestEnv');
});