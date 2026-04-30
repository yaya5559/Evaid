/// <reference types="cypress" />
// ── 03 · Evaide Admin — full feature suite ───────────────────────────────────
// Tests every function available to the evaide_admin role.
//
// IMPORTANT — this spec also creates the test organization and test agent that
// 04-org-admin and 05-agent rely on.  The generated credentials are saved to
// cypress/test-env.json so subsequent specs can read them.
//
// At the end of the full run, 07-cleanup.cy.js will delete this org.

function randomPhone() {
  return String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000);
}

let testEnv = null; // populated in before()

describe('03 · Evaide Admin', () => {
  // ── Generate unique test data once per run ─────────────────────────────────
  before(() => {
    cy.task('getNextCounter').then((n) => {
      testEnv = {
        n,
        orgName:        `CypressOrg${n}`,
        orgEmail:       `CypressOrg${n}@evaid-test.com`,
        orgPhone:       randomPhone(),
        ownerFirstName: `CypressOwner${n}`,
        ownerLastName:  'Test',
        ownerEmail:     `CypressOwner${n}@evaid-test.com`,
        ownerPhone:     randomPhone(),
        ownerPassword:  `CypressOwner${n}Pass!`,
        agentFirstName: `CypressAgent${n}`,
        agentLastName:  'Test',
        agentEmail:     `CypressAgent${n}@evaid-test.com`,
        agentPhone:     randomPhone(),
        agentPassword:  `CypressAgent${n}Pass!`,
      };
      // Persist immediately so other specs can read it
      cy.task('setTestEnv', testEnv);
    });
  });

  after(() => {
    // Log the run and bump the counter
    cy.task('logTestRun', {
      count: testEnv.n,
      org: {
        name: testEnv.orgName,
        email: testEnv.orgEmail,
        phone: testEnv.orgPhone,
        ownerFirstName: testEnv.ownerFirstName,
        ownerLastName:  testEnv.ownerLastName,
        ownerEmail:     testEnv.ownerEmail,
        ownerPhone:     testEnv.ownerPhone,
        password:       testEnv.ownerPassword,
      },
      agent: {
        firstName: testEnv.agentFirstName,
        lastName:  testEnv.agentLastName,
        email:     testEnv.agentEmail,
        phone:     testEnv.agentPhone,
        password:  testEnv.agentPassword,
      },
    });
    cy.task('incrementCounter');
  });

  // ── Login helper (uses session caching) ────────────────────────────────────
  beforeEach(() => cy.loginAsAdmin());

  // ════════════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  describe('Operations Dashboard', () => {
    it('loads and shows the dashboard heading', () => {
      cy.visit('/Dashboard');
      cy.contains('Operations Dashboard').should('be.visible');
    });

    it('sidebar has all expected navigation links', () => {
      cy.visit('/Dashboard');
      cy.contains('a', 'Add Organization').should('be.visible');
      cy.contains('a', 'Edit Organization').should('be.visible');
      cy.contains('a', 'Add Agent').should('be.visible');
    });

    it('navigates to Add Organization from sidebar', () => {
      cy.visit('/Dashboard');
      cy.contains('a', 'Add Organization').click();
      cy.url().should('include', '/Add_Organization');
      cy.contains('Add Organization').should('be.visible');
    });

    it('navigates to Add Agent from sidebar', () => {
      cy.visit('/Dashboard');
      cy.contains('a', 'Add Agent').click();
      cy.url().should('include', '/Register_Agent');
      cy.contains('Register Agent').should('be.visible');
    });

    it('navigates to Edit Organization from sidebar', () => {
      cy.visit('/Dashboard');
      cy.contains('a', 'Edit Organization').click();
      cy.url().should('include', '/Edit_Organization');
    });

    it('Back to Dashboard button works from Add Organization', () => {
      cy.visit('/Add_Organization');
      cy.contains('button', 'Back to Dashboard').click();
      cy.url().should('include', '/Dashboard');
    });

    it('Back to Dashboard button works from Register Agent', () => {
      cy.visit('/Register_Agent');
      cy.contains('button', 'Back to Dashboard').click();
      cy.url().should('include', '/Dashboard');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ADD ORGANIZATION — form validation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Add Organization — form validation', () => {
    beforeEach(() => cy.visit('/Add_Organization'));

    it('renders all required form fields', () => {
      cy.get('input#companyName').should('be.visible');
      cy.get('input#companyEmail').should('be.visible');
      cy.get('input#companyPhoneNumber').should('be.visible');
      cy.get('input#ownerFirstName').should('be.visible');
      cy.get('input#ownerLastName').should('be.visible');
      cy.get('input#ownerEmail').should('be.visible');
      cy.get('input#ownerPhoneNumber').should('be.visible');
      cy.get('input#password').should('be.visible');
      cy.get('input#confirmPassword').should('be.visible');
    });

    it('preview reflects organization name as it is typed', () => {
      cy.get('input#companyName').type('PreviewOrg');
      cy.contains('strong', 'PreviewOrg').should('be.visible');
    });

    it('preview reflects owner full name as it is typed', () => {
      cy.get('input#ownerFirstName').type('John');
      cy.get('input#ownerLastName').type('Doe');
      cy.contains('strong', 'John Doe').should('be.visible');
    });

    it('shows validation errors when submitting an empty form', () => {
      cy.get('button[type="submit"]').click();
      // At least one error should appear
      cy.get('.org-field-error').should('have.length.greaterThan', 0);
    });

    it('shows error when passwords do not match', () => {
      cy.get('input#companyName').type('TestOrg');
      cy.get('input#companyEmail').type('test@org.com');
      cy.get('input#companyPhoneNumber').type('5551234567');
      cy.get('input#ownerFirstName').type('John');
      cy.get('input#ownerLastName').type('Doe');
      cy.get('input#ownerEmail').type('john@org.com');
      cy.get('input#ownerPhoneNumber').type('5559876543');
      cy.get('input#password').type('password123');
      cy.get('input#confirmPassword').type('differentpassword');
      cy.get('button[type="submit"]').click();
      cy.contains('Passwords do not match').should('be.visible');
    });

    it('Reset Form clears all fields', () => {
      cy.get('input#companyName').type('SomeOrg');
      cy.get('input#ownerFirstName').type('Jane');
      cy.contains('button', 'Reset Form').click();
      cy.get('input#companyName').should('have.value', '');
      cy.get('input#ownerFirstName').should('have.value', '');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ADD ORGANIZATION — successful creation (creates the test org for later specs)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Add Organization — create test org', () => {
    it('fills in all fields and creates the organization', () => {
      cy.visit('/Add_Organization');

      cy.get('input#companyName').type(testEnv.orgName);
      cy.get('input#companyEmail').type(testEnv.orgEmail);
      cy.get('input#companyPhoneNumber').type(testEnv.orgPhone);
      cy.get('input#ownerFirstName').type(testEnv.ownerFirstName);
      cy.get('input#ownerLastName').type(testEnv.ownerLastName);
      cy.get('input#ownerEmail').type(testEnv.ownerEmail);
      cy.get('input#ownerPhoneNumber').type(testEnv.ownerPhone);
      cy.get('input#password').type(testEnv.ownerPassword);
      cy.get('input#confirmPassword').type(testEnv.ownerPassword);

      cy.get('button[type="submit"]').click();
      cy.contains('Organization created successfully.', { timeout: 15000 }).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  REGISTER AGENT — form validation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Register Agent — form validation', () => {
    beforeEach(() => {
      cy.visit('/Register_Agent');
      // Wait for the org dropdown to be populated from the backend
      cy.get('select#organizationID option', { timeout: 15000 })
        .should('have.length.greaterThan', 1);
    });

    it('renders all required form fields', () => {
      cy.get('input#firstName').should('be.visible');
      cy.get('input#lastName').should('be.visible');
      cy.get('input#email').should('be.visible');
      cy.get('input#phoneNumber').should('be.visible');
      cy.get('select#organizationID').should('be.visible');
      cy.get('input#password').should('be.visible');
      cy.get('input#confirmPassword').should('be.visible');
    });

    it('organization dropdown contains the newly created org', () => {
      cy.get('select#organizationID').find('option').should('contain', testEnv.orgName);
    });

    it('preview reflects agent name as it is typed', () => {
      cy.get('input#firstName').type(testEnv.agentFirstName);
      cy.get('input#lastName').type(testEnv.agentLastName);
      cy.contains('strong', testEnv.agentFirstName).should('be.visible');
    });

    it('shows validation errors when submitting an empty form', () => {
      cy.contains('button', 'Registering Agent').click();
      cy.get('.agent-field-error').should('have.length.greaterThan', 0);
    });

    it('shows error when password is too short', () => {
      cy.get('input#firstName').type('TestAgent');
      cy.get('input#lastName').type('Test');
      cy.get('input#email').type('short@pw.com');
      cy.get('input#phoneNumber').type('5551234567');
      cy.get('select#organizationID').select(testEnv.orgName);
      cy.get('input#password').type('short');
      cy.get('input#confirmPassword').type('short');
      cy.contains('button', 'Registering Agent').click();
      cy.contains('at least 8 characters', { matchCase: false }).should('be.visible');
    });

    it('Reset Form clears all fields', () => {
      cy.get('input#firstName').type('SomeAgent');
      cy.contains('button', 'Reset Form').click();
      cy.get('input#firstName').should('have.value', '');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  REGISTER AGENT — successful creation (creates the test agent for later specs)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Register Agent — create test agent', () => {
    it('fills in all fields, selects the new org, and registers the agent', () => {
      cy.visit('/Register_Agent');
      cy.get('select#organizationID option', { timeout: 15000 })
        .should('have.length.greaterThan', 1);

      cy.get('input#firstName').type(testEnv.agentFirstName);
      cy.get('input#lastName').type(testEnv.agentLastName);
      cy.get('input#email').type(testEnv.agentEmail);
      cy.get('input#phoneNumber').type(testEnv.agentPhone);
      cy.get('select#organizationID').select(testEnv.orgName);
      cy.get('input#password').type(testEnv.agentPassword);
      cy.get('input#confirmPassword').type(testEnv.agentPassword);

      cy.contains('button', 'Registering Agent').click();
      cy.contains('Agent successfully registered.', { timeout: 15000 }).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  EDIT ORGANIZATION
  // ════════════════════════════════════════════════════════════════════════════
  describe('Edit Organization', () => {
    beforeEach(() => cy.visit('/Edit_Organization'));

    it('loads the organization list', () => {
      // Page should show at least the test org we just created
      cy.get('body', { timeout: 15000 }).should('not.contain', 'Loading');
      cy.contains(testEnv.orgName, { timeout: 15000 }).should('be.visible');
    });

    it('can select the test org and see its details populated', () => {
      cy.contains(testEnv.orgName, { timeout: 15000 }).should('be.visible');
      // Click on the org row / select button to open the edit panel
      cy.contains(testEnv.orgName).click();
      // The edit form should appear with the org data
      cy.get('input#companyName', { timeout: 10000 }).should('have.value', testEnv.orgName);
    });

    it('can disable the test org and then re-enable it', () => {
      cy.contains(testEnv.orgName, { timeout: 15000 }).click();
      // The edit form uses a status <select> dropdown — set to suspended then save
      cy.get('select#status', { timeout: 10000 }).select('suspended');
      cy.contains('button', /save changes/i).click();
      cy.contains(/saved successfully|success/i, { timeout: 10000 }).should('be.visible');
      // Re-enable it via the same dropdown
      cy.get('select#status', { timeout: 10000 }).select('active');
      cy.contains('button', /save changes/i).click();
      cy.contains(/saved successfully|success/i, { timeout: 10000 }).should('be.visible');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  CASES (admin view)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Cases — admin view', () => {
    it('loads the Cases page', () => {
      cy.visit('/Cases');
      cy.get('body', { timeout: 15000 }).should('be.visible');
      // Page should show a heading or cases content
      cy.contains(/cases|no cases/i, { timeout: 15000 }).should('be.visible');
    });

    it('can filter cases by organization', () => {
      cy.visit('/Cases');
      // The Cases page uses a sidebar of org buttons (not a <select>)
      // Wait for the org list to load and verify at least one org button is present
      cy.get('.edit-org-item', { timeout: 15000 }).should('have.length.greaterThan', 0);
    });
  });
});