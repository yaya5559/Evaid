/// <reference types="cypress" />
// ── 04 · Organization Admin — full feature suite ─────────────────────────────
// Tests every function available to the org_admin role using the org and
// credentials created by 03-evaide-admin.cy.js.
//
// All tests are skipped gracefully if test-env.json is missing.

let env = null;
let orgAgentFirstName = null; // set after the org admin registers their own agent

describe('04 · Organization Admin', () => {
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
    cy.loginAs(env.ownerEmail, env.ownerPassword);
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ORGANIZATION DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  describe('Org Dashboard', () => {
    it('loads and shows dashboard heading', function () {
      cy.visit('/Org_Dashboard');
      cy.contains('Overview', { timeout: 15000 }).should('be.visible');
    });

    it('displays the organization name', function () {
      cy.visit('/Org_Dashboard');
      cy.contains(env.orgName, { timeout: 15000 }).should('be.visible');
    });

    it('shows the case table or empty state', function () {
      cy.visit('/Org_Dashboard');
      cy.contains(/Case Register|No cases found|cases/i, { timeout: 15000 }).should('be.visible');
    });

    it('sidebar has expected navigation links', function () {
      cy.visit('/Org_Dashboard');
      cy.contains(/case progress|cases/i).should('be.visible');
      cy.contains(/agents/i).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  CASE PROGRESS
  // ════════════════════════════════════════════════════════════════════════════
  describe('Case Progress', () => {
    it('loads the case progress page', function () {
      cy.visit('/OrgCaseProgress');
      cy.get('body', { timeout: 15000 }).should('be.visible');
      cy.contains(/cases|no cases|start a case/i, { timeout: 15000 }).should('be.visible');
    });

    it('has a button to start a new case', function () {
      cy.visit('/OrgCaseProgress');
      cy.contains(/start|new case/i, { timeout: 15000 }).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  START CASE — form validation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Start Case — form validation', () => {
    beforeEach(() => cy.visit('/OrgStartCase'));

    it('renders the start case form', function () {
      cy.contains('Start a New Case').should('be.visible');
      cy.get('input.edit-org-input[type="text"]').should('be.visible');
    });

    it('Create Case button is disabled when title is empty', function () {
      cy.contains('button', 'Create Case').should('be.disabled');
    });

    it('Create Case button enables when a title is entered', function () {
      cy.get('input.edit-org-input[type="text"]').type('Test title');
      cy.contains('button', 'Create Case').should('not.be.disabled');
    });

    it('priority dropdown has expected options', function () {
      cy.get('select.edit-org-input').first()
        .find('option')
        .should('contain', 'Low')
        .and('contain', 'Medium')
        .and('contain', 'High')
        .and('contain', 'Critical');
    });

    it('Cancel button navigates back to case progress', function () {
      cy.contains('button', 'Cancel').click();
      cy.url().should('include', '/OrgCaseProgress');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  START CASE — successful creation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Start Case — create a case', () => {
    it('creates a case and navigates to OrgCaseProgress', function () {
      cy.visit('/OrgStartCase');
      cy.get('input.edit-org-input[type="text"]').type('Cypress Test Case');
      cy.get('textarea.edit-org-input').type('Created by automated Cypress test');
      cy.get('select.edit-org-input').first().select('High');   // priority
      cy.contains('button', 'Create Case').click();
      cy.url({ timeout: 20000 }).should('include', '/OrgCaseProgress');
    });

    it('newly created case appears in the case list', function () {
      cy.visit('/OrgCaseProgress');
      cy.contains('Cypress Test Case', { timeout: 15000 }).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  CASE DETAIL
  // ════════════════════════════════════════════════════════════════════════════
  describe('Case Detail', () => {
    it('clicking a case navigates to the case detail page', function () {
      cy.visit('/OrgCaseProgress');
      cy.contains('Cypress Test Case', { timeout: 15000 })
        .closest('.orgdash-progress-row')
        .contains('button', 'Work on Case')
        .click();
      cy.url({ timeout: 15000 }).should('match', /\/OrgCase\/\d+/);
    });

    it('case detail shows case title', function () {
      cy.visit('/OrgCaseProgress');
      cy.contains('Cypress Test Case', { timeout: 15000 })
        .closest('.orgdash-progress-row')
        .contains('button', 'Work on Case')
        .click();
      cy.url({ timeout: 15000 }).should('match', /\/OrgCase\/\d+/);
      cy.contains('Cypress Test Case').should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ORG REGISTER AGENT — form validation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Org Register Agent — form validation', () => {
    beforeEach(() => cy.visit('/OrgRegisterAgent'));

    it('renders the register agent form', function () {
      cy.contains('Register Agent').should('be.visible');
      cy.get('input[name="firstName"]').should('be.visible');
      cy.get('input[name="lastName"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="phoneNumber"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
    });

    it('shows validation errors when submitting empty form', function () {
      cy.get('button[type="submit"]').click();
      cy.get('.agent-field-error').should('have.length.greaterThan', 0);
    });

    it('shows error when passwords do not match', function () {
      cy.get('input[name="firstName"]').type('Alice');
      cy.get('input[name="lastName"]').type('Smith');
      cy.get('input[name="email"]').type('alice@org.com');
      cy.get('input[name="phoneNumber"]').type('5551234567');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('DifferentPass!');
      cy.get('button[type="submit"]').click();
      cy.contains('Passwords do not match').should('be.visible');
    });

    it('preview updates as fields are filled', function () {
      cy.get('input[name="firstName"]').type('Alice');
      cy.get('input[name="lastName"]').type('Smith');
      cy.contains('strong', 'Alice').should('be.visible');
      cy.contains('strong', 'Smith').should('be.visible');
    });

    it('Reset Form clears all fields', function () {
      cy.get('input[name="firstName"]').type('TempName');
      cy.contains('button', 'Reset Form').click();
      cy.get('input[name="firstName"]').should('have.value', '');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ORG REGISTER AGENT — create the org's own agent
  //  This runs BEFORE the Org Agents section so that agent exists to view.
  // ════════════════════════════════════════════════════════════════════════════
  describe('Org Register Agent — create org agent', () => {
    it('registers an agent via the org admin form', function () {
      orgAgentFirstName = `CypressAgent2${env.n}`;
      const agent = {
        firstName: orgAgentFirstName,
        lastName:  'Test',
        email:     `CypressAgent2${env.n}@evaid-test.com`,
        phone:     String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000),
        password:  `CypressAgent2${env.n}Pass!`,
      };

      cy.visit('/OrgRegisterAgent');
      cy.get('input[name="firstName"]').type(agent.firstName);
      cy.get('input[name="lastName"]').type(agent.lastName);
      cy.get('input[name="email"]').type(agent.email);
      cy.get('input[name="phoneNumber"]').type(agent.phone);
      cy.get('input[name="password"]').type(agent.password);
      cy.get('input[name="confirmPassword"]').type(agent.password);
      cy.get('button[type="submit"]').click();

      cy.contains(/registered successfully|Agent successfully/i, { timeout: 15000 })
        .should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ORG AGENTS — uses the agent registered above
  // ════════════════════════════════════════════════════════════════════════════
  describe('Org Agents', () => {
    it('loads the agents page', function () {
      cy.visit('/OrgAgents');
      cy.get('body', { timeout: 15000 }).should('be.visible');
      cy.contains(/agents|no agents/i, { timeout: 15000 }).should('be.visible');
    });

    it('shows the agent registered by the org admin', function () {
      cy.visit('/OrgAgents');
      cy.contains(orgAgentFirstName, { timeout: 15000 }).should('be.visible');
    });

    it('can disable an agent', function () {
      cy.visit('/OrgAgents');
      cy.contains(orgAgentFirstName, { timeout: 15000 });
      cy.contains(orgAgentFirstName)
        .closest('[class]')
        .contains('button', /disable/i)
        .click();
      cy.contains(/success|disabled/i, { timeout: 10000 }).should('be.visible');
    });

    it('can re-enable the agent', function () {
      cy.visit('/OrgAgents');
      // Toggle on "Show disabled agents" so the disabled agent is visible
      cy.get('[role="switch"]').click();
      cy.contains(orgAgentFirstName, { timeout: 15000 });
      cy.contains(orgAgentFirstName)
        .closest('[class]')
        .contains('button', /enable/i)
        .click();
      cy.contains(/success|enabled/i, { timeout: 10000 }).should('be.visible');
    });

    it('search filters the agent list', function () {
      cy.visit('/OrgAgents');
      cy.get('input[placeholder*="search" i]', { timeout: 10000 }).type(orgAgentFirstName);
      cy.contains(orgAgentFirstName).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ASSIGN AGENT TO CASE
  // ════════════════════════════════════════════════════════════════════════════
  describe('Case Assignments', () => {
    it('can open a case and see the Assign Agent section', function () {
      cy.visit('/OrgCaseProgress');
      cy.contains('Cypress Test Case', { timeout: 15000 })
        .closest('.orgdash-progress-row')
        .contains('button', 'Work on Case')
        .click();
      cy.url({ timeout: 15000 }).should('match', /\/OrgCase\/\d+/);
      // Look for assignment section
      cy.contains(/assign|agents/i, { timeout: 10000 }).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  EVIDENCE UPLOAD PAGE (accessible to org_admin)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Evidence Upload', () => {
    it('loads the Evidence Upload page', function () {
      cy.visit('/Evidence_Upload');
      cy.get('body', { timeout: 15000 }).should('be.visible');
      cy.contains(/evidence|upload/i, { timeout: 15000 }).should('be.visible');
    });
  });
});
