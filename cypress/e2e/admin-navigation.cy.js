/// <reference types="cypress" />

const adminEmail = 'Yusuf@Admin.com';
const adminPassword = 'TheGoat';

function loginAsAdmin() {
  cy.visit('http://localhost:5173/Login');
  cy.get('input#email').type(adminEmail);
  cy.get('input#password').type(adminPassword, { log: false });
  cy.get('button.btn[type="submit"]').click();
  cy.url({ timeout: 8000 }).should('include', '/Dashboard');
}

describe('Admin navigation after login', () => {
  beforeEach(() => {
    loginAsAdmin();
  });

  it('shows all sidebar nav links', () => {
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Add Organization').should('be.visible');
    cy.contains('Edit Organization').should('be.visible');
    cy.contains('Register Agent').should('be.visible');
  });

  it('clicking Add Organization navigates to the correct page', () => {
    cy.contains('a', 'Add Organization').click();
    cy.url().should('include', '/Add_Organization');
    cy.contains('h1', 'Add Organization').should('be.visible');
  });

  it('clicking Register Agent navigates to the correct page', () => {
    cy.contains('a', 'Register Agent').click();
    cy.url().should('include', '/Register_Agent');
    cy.contains('h1', 'Register Agent').should('be.visible');
  });

  it('clicking Edit Organization navigates to the correct page', () => {
    cy.contains('a', 'Edit Organization').click();
    cy.url().should('include', '/Edit_Organization');
  });

  it('Back to Dashboard from Add Organization returns to dashboard', () => {
    cy.contains('a', 'Add Organization').click();
    cy.contains('button', 'Back to Dashboard').click();
    cy.url().should('include', '/Dashboard');
  });

  it('Back to Dashboard from Register Agent returns to dashboard', () => {
    cy.contains('a', 'Register Agent').click();
    cy.contains('button', 'Back to Dashboard').click();
    cy.url().should('include', '/Dashboard');
  });
});
