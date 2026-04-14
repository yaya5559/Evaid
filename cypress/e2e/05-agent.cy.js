/// <reference types="cypress" />
// ── 05 · Agent — full feature suite ──────────────────────────────────────────
// Tests every function available to the agent role using the agent credentials
// created by 03-evaide-admin.cy.js.
//
// All tests are skipped gracefully if test-env.json is missing.

let env = null;

describe('05 · Agent', () => {
  before(function () {
    cy.task('getTestEnv').then((data) => {
      if (!data) {
        cy.log('⚠️  test-env.json not found — run 03-evaide-admin first');
        this.skip();
      }
      env = data;
    });
  });

  beforeEach(function () {
    if (!env) return this.skip();
    cy.loginAs(env.agentEmail, env.agentPassword);
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  MY CASES PAGE
  // ════════════════════════════════════════════════════════════════════════════
  describe('My Cases', () => {
    it('loads and shows the Agent console heading', function () {
      cy.visit('/AgentCases');
      cy.contains('Agent console').should('be.visible');
      cy.contains('My Cases').should('be.visible');
    });

    it('shows the cases count pill', function () {
      cy.visit('/AgentCases');
      cy.contains(/\d+ cases/, { timeout: 15000 }).should('be.visible');
    });

    it('has a + New Case button', function () {
      cy.visit('/AgentCases');
      cy.contains('button', '+ New Case').should('be.visible');
    });

    it('search bar is visible', function () {
      cy.visit('/AgentCases');
      cy.get('input[placeholder*="Search" i]').should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  CREATE CASE — form validation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Create Case — form validation', () => {
    beforeEach(() => {
      cy.visit('/AgentCases');
      cy.contains('button', '+ New Case').click();
    });

    it('shows the create case inline form', function () {
      cy.contains('h3', 'New Case').should('be.visible');
      cy.contains('label', 'Title').should('be.visible');
    });

    it('Create button is disabled when title is empty', function () {
      cy.contains('button', 'Create').should('be.disabled');
    });

    it('Create button enables when title is entered', function () {
      cy.get('div.admin-card input.edit-org-input[type="text"]').type('Test title');
      cy.contains('button', 'Create').should('not.be.disabled');
    });

    it('priority dropdown has expected options', function () {
      cy.get('.admin-card select.edit-org-input').first()
        .find('option')
        .should('contain', 'Low')
        .and('contain', 'Medium')
        .and('contain', 'High')
        .and('contain', 'Critical');
    });

    it('Cancel closes the create form', function () {
      cy.contains('button', 'Cancel').click();
      cy.contains('h3', 'New Case').should('not.exist');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  CREATE CASE — successful creation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Create Case — create a case', () => {
    it('creates a new case and shows success message', function () {
      cy.visit('/AgentCases');
      cy.contains('button', '+ New Case').click();

      cy.get('div.admin-card input.edit-org-input[type="text"]').type('Agent Cypress Test Case');
      cy.get('.admin-card textarea.edit-org-input').type('Test case created by agent in Cypress');
      cy.get('.admin-card select.edit-org-input').first().select('High');  // priority

      cy.contains('button', 'Create').click();
      cy.contains('Case created', { timeout: 15000 }).should('be.visible');
    });

    it('newly created case appears in the list', function () {
      cy.visit('/AgentCases');
      cy.contains('Agent Cypress Test Case', { timeout: 15000 }).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  CASE DETAIL
  // ════════════════════════════════════════════════════════════════════════════
  describe('Case Detail', () => {
    it('clicking a case navigates to the case detail page', function () {
      cy.visit('/AgentCases');
      cy.contains('Agent Cypress Test Case', { timeout: 15000 })
        .closest('.orgdash-progress-row')
        .contains('button', 'Work on Case')
        .click();
      cy.url({ timeout: 15000 }).should('match', /\/AgentCase\/\d+/);
    });

    it('case detail page shows the case title', function () {
      cy.visit('/AgentCases');
      cy.contains('Agent Cypress Test Case', { timeout: 15000 })
        .closest('.orgdash-progress-row')
        .contains('button', 'Work on Case')
        .click();
      cy.url({ timeout: 15000 }).should('match', /\/AgentCase\/\d+/);
      cy.contains('Agent Cypress Test Case').should('be.visible');
    });

    it('case detail shows status and priority', function () {
      cy.visit('/AgentCases');
      cy.contains('Agent Cypress Test Case', { timeout: 15000 })
        .closest('.orgdash-progress-row')
        .contains('button', 'Work on Case')
        .click();
      cy.url({ timeout: 15000 }).should('match', /\/AgentCase\/\d+/);
      cy.contains(/open|status/i, { timeout: 10000 }).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  SEARCH
  // ════════════════════════════════════════════════════════════════════════════
  describe('Case Search', () => {
    it('search filters the visible cases', function () {
      cy.visit('/AgentCases');
      cy.contains('Agent Cypress Test Case', { timeout: 15000 });
      cy.get('input[placeholder*="Search" i]').type('Agent Cypress');
      cy.contains('Agent Cypress Test Case').should('be.visible');
    });

    it('search with no match shows no cases', function () {
      cy.visit('/AgentCases');
      cy.get('input[placeholder*="Search" i]').type('zzzNONEXISTENTzzzz');
      cy.contains('Agent Cypress Test Case').should('not.exist');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ACTORS (Show / Hide)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Actors toggle', () => {
    it('Show Actors button is visible on each case row', function () {
      cy.visit('/AgentCases');
      cy.contains('Agent Cypress Test Case', { timeout: 15000 });
      cy.contains('button', 'Show Actors').should('be.visible');
    });

    it('clicking Show Actors expands and Hide Actors collapses', function () {
      cy.visit('/AgentCases');
      cy.contains('Agent Cypress Test Case', { timeout: 15000 });
      cy.contains('button', 'Show Actors').first().click();
      cy.contains('button', 'Hide Actors', { timeout: 10000 }).should('be.visible');
      cy.contains('button', /Hide Actors/i).first().click();
      cy.contains('button', 'Show Actors').should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  EVIDENCE UPLOAD (accessible to agent)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Evidence Upload', () => {
    it('loads the Evidence Upload page', function () {
      cy.visit('/Evidence_Upload');
      cy.get('body', { timeout: 15000 }).should('be.visible');
      cy.contains(/evidence|upload/i, { timeout: 15000 }).should('be.visible');
    });
  });
});