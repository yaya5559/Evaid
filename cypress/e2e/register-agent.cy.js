/// <reference types="cypress" />

describe('Register Agent page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/Register_Agent');
  });

  it('shows the correct heading and eyebrow text', () => {
    cy.contains('Register Agent').should('be.visible');
    cy.contains('Agent registration').should('be.visible');
    cy.contains('Add an agent to an organization').should('be.visible');
  });

  it('shows all form fields', () => {
    cy.get('input#firstName').should('be.visible');
    cy.get('input#lastName').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('input#phoneNumber').should('be.visible');
    cy.get('select#organizationID').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('input#confirmPassword').should('be.visible');
  });

  it('organization dropdown shows the placeholder option', () => {
    cy.get('select#organizationID').should('be.visible');
    cy.get('select#organizationID option[disabled]')
      .should('contain', 'Select an organization');
  });

  it('shows validation error for empty first name on submit', () => {
    cy.contains('button', 'Registering Agent').click();
    cy.contains('First name is required.').should('be.visible');
  });

  it('shows validation error for invalid email on submit', () => {
    cy.get('input#firstName').type('John');
    cy.get('input#lastName').type('Doe');
    cy.get('input#email').type('notanemail');
    cy.get('input#phoneNumber').type('+1 555 000 0000');
    cy.get('input#password').type('Password1234');
    cy.get('input#confirmPassword').type('Password1234');
    cy.contains('button', 'Registering Agent').click();
    cy.contains('Enter a valid email address.').should('be.visible');
  });

  it('shows a password mismatch error', () => {
    cy.get('input#firstName').type('John');
    cy.get('input#lastName').type('Doe');
    cy.get('input#email').type('john@example.com');
    cy.get('input#phoneNumber').type('+1 555 000 0000');
    cy.get('input#password').type('Password1234');
    cy.get('input#confirmPassword').type('DifferentPass');
    cy.contains('button', 'Registering Agent').click();
    cy.contains('Passwords do not match.').should('be.visible');
  });

  it('shows a short password error', () => {
    cy.get('input#firstName').type('John');
    cy.get('input#lastName').type('Doe');
    cy.get('input#email').type('john@example.com');
    cy.get('input#phoneNumber').type('+1 555 000 0000');
    cy.get('input#password').type('short');
    cy.get('input#confirmPassword').type('short');
    cy.contains('button', 'Registering Agent').click();
    cy.contains('Password must be at least 8 characters.').should('be.visible');
  });

  it('preview updates with first name as you type', () => {
    cy.get('input#firstName').type('Alice');
    cy.contains('strong', 'Alice').should('be.visible');
  });

  it('preview updates with last name as you type', () => {
    cy.get('input#lastName').type('Smith');
    cy.contains('strong', 'Smith').should('be.visible');
  });

  it('preview updates with agent email as you type', () => {
    cy.get('input#email').type('alice@unit.gov');
    cy.contains('strong', 'alice@unit.gov').should('be.visible');
  });

  it('reset form clears all fields and resets preview', () => {
    cy.get('input#firstName').type('Alice');
    cy.get('input#email').type('alice@example.com');
    cy.contains('button', 'Reset Form').click();
    cy.get('input#firstName').should('have.value', '');
    cy.get('input#email').should('have.value', '');
    cy.contains('strong', 'Not set').should('exist');
  });

  it('Back to Dashboard button navigates to the dashboard', () => {
    cy.contains('button', 'Back to Dashboard').click();
    cy.url().should('include', '/Dashboard');
  });
});
