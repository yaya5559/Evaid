/// <reference types="cypress" />
// Each run auto-increments the counter stored in cypress/counter.json.
// Every run's input data is appended to cypress/test-data.txt.

// Generates a random 10-digit phone number unlikely to collide with prior runs
function randomPhone() {
  return String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000);
}

describe('Create organization then add an agent to it', () => {
  let n;    // counter for this run  (e.g. 3, 4, 5 …)
  let org;  // org data object built from n
  let agent; // agent data object built from n

  // ── Read counter once before all tests ────────────────
  before(() => {
    cy.task('getNextCounter').then((count) => {
      n = count;

      org = {
        name:           `Test${n}`,
        email:          `TestOrg${n}@gmail.com`,
        phone:          randomPhone(),
        ownerFirstName: `Tester${n}`,
        ownerLastName:  `Tester${n}`,
        ownerEmail:     `TestOwner${n}@gmail.com`,
        ownerPhone:     randomPhone(),
        password:       `Test${n}Password`,
      };

      agent = {
        firstName: `TestAgent${n}`,
        lastName:  `TestAgent${n}`,
        email:     `Test${n}@Agent.com`,
        phone:     randomPhone(),
        password:  `TestAgent${n}`,
      };
    });
  });

  // ── Log data and bump counter after all tests ──────────
  after(() => {
    cy.task('logTestRun', { count: n, org, agent });
    cy.task('incrementCounter');
  });

  // ──────────────────────────────────────────────────────
  //  PART 1 — Create the organization
  // ──────────────────────────────────────────────────────
  describe('Add Organization', () => {
    it('fills in all fields and submits successfully', () => {
      cy.visit('http://localhost:5173/Add_Organization');

      cy.get('input#companyName').type(org.name);
      cy.get('input#companyEmail').type(org.email);
      cy.get('input#companyPhoneNumber').type(org.phone);
      cy.get('input#ownerFirstName').type(org.ownerFirstName);
      cy.get('input#ownerLastName').type(org.ownerLastName);
      cy.get('input#ownerEmail').type(org.ownerEmail);
      cy.get('input#ownerPhoneNumber').type(org.ownerPhone);
      cy.get('input#password').type(org.password);
      cy.get('input#confirmPassword').type(org.password);

      cy.contains('button', 'Create Organization').click();

      cy.contains('Organization created successfully.', { timeout: 10000 })
        .should('be.visible');
    });

    it('preview shows the organization name during entry', () => {
      cy.visit('http://localhost:5173/Add_Organization');
      cy.get('input#companyName').type(org.name);
      cy.contains('strong', org.name).should('be.visible');
    });

    it('preview shows the owner full name during entry', () => {
      cy.visit('http://localhost:5173/Add_Organization');
      cy.get('input#ownerFirstName').type(org.ownerFirstName);
      cy.get('input#ownerLastName').type(org.ownerLastName);
      cy.contains('strong', `${org.ownerFirstName} ${org.ownerLastName}`).should('be.visible');
    });
  });

  // ──────────────────────────────────────────────────────
  //  PART 2 — Register an agent to that organization
  //  Depends on the org created in Part 1 being in the DB.
  // ──────────────────────────────────────────────────────
  describe('Register Agent', () => {
    beforeEach(() => {
      cy.visit('http://localhost:5173/Register_Agent');
      // Wait for the dropdown to be populated from the backend
      cy.get('select#organizationID option', { timeout: 10000 })
        .should('have.length.greaterThan', 1);
    });

    it('fills in all fields, selects the new org, and submits successfully', () => {
      cy.get('input#firstName').type(agent.firstName);
      cy.get('input#lastName').type(agent.lastName);
      cy.get('input#email').type(agent.email);
      cy.get('input#phoneNumber').type(agent.phone);
      cy.get('select#organizationID').select(org.name);
      cy.get('input#password').type(agent.password);
      cy.get('input#confirmPassword').type(agent.password);

      cy.contains('button', 'Registering Agent').click();

      cy.contains('Agent successfully registered.', { timeout: 10000 })
        .should('be.visible');
    });

    it('org dropdown contains the newly created organization', () => {
      cy.get('select#organizationID').find('option')
        .should('contain', org.name);
    });

    it('preview shows the agent name during entry', () => {
      cy.get('input#firstName').type(agent.firstName);
      cy.get('input#lastName').type(agent.lastName);
      cy.contains('strong', agent.firstName).should('be.visible');
      cy.contains('strong', agent.lastName).should('be.visible');
    });
  });
});
