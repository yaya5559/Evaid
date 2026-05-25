/// <reference types="cypress" />
// ── 02 · Authentication ───────────────────────────────────────────────────────
// Tests login form validation, error handling, and successful login for all
// three roles.  Org-admin and agent credentials come from test-env.json which
// is written by 03-evaide-admin.cy.js; those blocks are skipped gracefully if
// the file is not yet present.

describe('Login page — form validation', () => {
  beforeEach(() => cy.visit('/Login'));

  it('renders the login form', () => {
    cy.contains('Sign in to continue').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('Submit button is disabled when fields are empty', () => {
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('Submit button is disabled with invalid email', () => {
    cy.get('input#email').type('notanemail');
    cy.get('input#password').type('somepassword');
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('Submit button is enabled with valid email and non-empty password', () => {
    cy.get('input#email').type('valid@example.com');
    cy.get('input#password').type('password123');
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('shows error message for wrong credentials', () => {
    cy.get('input#email').type('wrong@evaide.com');
    cy.get('input#password').type('wrongpassword123');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible');
  });

  it('password field masks input by default', () => {
    cy.get('input#password').should('have.attr', 'type', 'password');
  });

  it('can toggle password visibility', () => {
    cy.get('input#password').type('mypassword');
    // Find and click the show/hide toggle button
    cy.get('button[type="button"]').contains(/show|hide/i).click();
    cy.get('input#password').should('have.attr', 'type', 'text');
    cy.get('button[type="button"]').contains(/show|hide/i).click();
    cy.get('input#password').should('have.attr', 'type', 'password');
  });

  it('Remember me checkbox can be toggled', () => {
    cy.get('input[type="checkbox"]').first().as('checkbox');
    cy.get('@checkbox').then(($cb) => {
      const initial = $cb.prop('checked');
      cy.get('@checkbox').click();
      cy.get('@checkbox').should(initial ? 'not.be.checked' : 'be.checked');
    });
  });
});

describe('Login — evaide_admin role', () => {
  it('logs in and lands on /Dashboard', () => {
    cy.visit('/Login');
    cy.get('input#email').type('admin@evaide.com');
    cy.get('input#password').type('dAtAbaS3w0rk!?,', { log: false });
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 20000 }).should('include', '/Dashboard');
    cy.contains('Operations Dashboard').should('be.visible');
  });

  it('dashboard shows the expected sidebar links', () => {
    cy.loginAsAdmin();
    cy.visit('/Dashboard');
    cy.contains('Add Organization').should('be.visible');
    cy.contains('Edit Organization').should('be.visible');
    cy.contains('Add Agent').should('be.visible');
  });
});

describe('Login — org_admin role', () => {
  before(function () {
    cy.task('getTestEnv').then((env) => {
      if (!env) this.skip();
      else Cypress.env('testEnv', env);
    });
  });

  it('logs in and lands on /Org_Dashboard', function () {
    const env = Cypress.env('testEnv');
    if (!env) return this.skip();

    cy.visit('/Login');
    cy.get('input#email').type(env.ownerEmail);
    cy.get('input#password').type(env.ownerPassword, { log: false });
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 20000 }).should('include', '/Org_Dashboard');
  });
});

describe('Login — agent role', () => {
  before(function () {
    cy.task('getTestEnv').then((env) => {
      if (!env) this.skip();
      else Cypress.env('testEnv', env);
    });
  });

  it('logs in and lands on /AgentCases', function () {
    const env = Cypress.env('testEnv');
    if (!env) return this.skip();

    cy.visit('/Login');
    cy.get('input#email').type(env.agentEmail);
    cy.get('input#password').type(env.agentPassword, { log: false });
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 20000 }).should('include', '/AgentCases');
  });
});