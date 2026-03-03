/// <reference types="cypress" />

describe('Add Organization page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/Add_Organization');
  });

  it('shows the correct heading and eyebrow text', () => {
    cy.contains('Add Organization').should('be.visible');
    cy.contains('Organization onboarding').should('be.visible');
    cy.contains('Create an organization profile').should('be.visible');
  });

  it('shows all form fields', () => {
    cy.get('input#companyName').should('be.visible');
    cy.get('input#companyEmail').should('be.visible');
    cy.get('input#companyPhoneNumber').should('be.visible');
    cy.get('input#ownerFirstName').should('be.visible');
    cy.get('input#ownerLastName').should('be.visible');
    cy.get('input#ownerEmail').should('be.visible');
    cy.get('input#ownerPhoneNumber').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('input#confirmPassword').should('be.visible');
    cy.get('textarea#description').should('be.visible');
  });

  it('shows a validation error on empty form submit', () => {
    cy.contains('button', 'Create Organization').click();
    cy.get('.org-field-error').should('have.length.greaterThan', 0);
  });

  it('preview updates with organization name as you type', () => {
    cy.get('input#companyName').type('Metro Intelligence Unit');
    cy.contains('strong', 'Metro Intelligence Unit').should('be.visible');
  });

  it('preview updates with owner name as you type', () => {
    cy.get('input#ownerFirstName').type('John');
    cy.get('input#ownerLastName').type('Doe');
    cy.contains('strong', 'John Doe').should('be.visible');
  });

  it('preview updates with organization email as you type', () => {
    cy.get('input#companyEmail').type('unit@agency.gov');
    cy.contains('strong', 'unit@agency.gov').should('be.visible');
  });

  it('reset form clears all fields and preview', () => {
    cy.get('input#companyName').type('Test Corp');
    cy.get('input#companyEmail').type('test@corp.com');
    cy.contains('button', 'Reset Form').click();
    cy.get('input#companyName').should('have.value', '');
    cy.get('input#companyEmail').should('have.value', '');
    cy.contains('strong', 'Not set').should('exist');
  });

  it('shows a password mismatch error', () => {
    cy.get('input#companyName').type('Test Corp');
    cy.get('input#companyEmail').type('test@corp.com');
    cy.get('input#companyPhoneNumber').type('+1 555 000 0000');
    cy.get('input#ownerFirstName').type('John');
    cy.get('input#ownerLastName').type('Doe');
    cy.get('input#ownerEmail').type('owner@corp.com');
    cy.get('input#ownerPhoneNumber').type('+1 555 000 0001');
    cy.get('input#password').type('Password1234');
    cy.get('input#confirmPassword').type('DifferentPassword');
    cy.contains('button', 'Create Organization').click();
    cy.contains('Passwords do not match.').should('be.visible');
  });

  it('shows a short password error', () => {
    cy.get('input#companyName').type('Test Corp');
    cy.get('input#companyEmail').type('test@corp.com');
    cy.get('input#companyPhoneNumber').type('+1 555 000 0000');
    cy.get('input#ownerFirstName').type('John');
    cy.get('input#ownerLastName').type('Doe');
    cy.get('input#ownerEmail').type('owner@corp.com');
    cy.get('input#ownerPhoneNumber').type('+1 555 000 0001');
    cy.get('input#password').type('short');
    cy.get('input#confirmPassword').type('short');
    cy.contains('button', 'Create Organization').click();
    cy.contains('Password must be at least 8 characters.').should('be.visible');
  });

  it('Back to Dashboard button navigates to the dashboard', () => {
    cy.contains('button', 'Back to Dashboard').click();
    cy.url().should('include', '/Dashboard');
  });
});
