/// <reference types="cypress" />

describe('Login flow', () => {
  const baseUrl = 'http://localhost:5173/';

  it('starts at the home page', () => {
    cy.visit(baseUrl);
    cy.url().should('eq', baseUrl);
  });

  it('navigates to Login when clicking Login', () => {
    cy.visit(baseUrl);
    cy.contains('Login').click();
    cy.url().should('include', '/Login');
  });

  it('shows expected login page words', () => {
    cy.visit(baseUrl);
    cy.contains('Login').click();
    cy.contains('Sign in to continue').should('be.visible');
    cy.contains('Password').should('be.visible');
    cy.contains('Remember me').should('be.visible');
    cy.contains('Forgot password').should('be.visible');
  });

  it('can toggle Remember me checkbox', () => {
    cy.visit(baseUrl);
    cy.contains('Login').click();
    cy.get('label.checkbox input[type="checkbox"]').check().should('be.checked');
  });

  it('submits credentials and lands on dashboard', () => {
    cy.visit(baseUrl);
    cy.contains('Login').click();
    cy.get('input#email').click().clear().type('admin@evaide.com');
    cy.get('input#password').click().clear().type('dAtAbaS3w0rk!?,' , { log: false });
    cy.contains('Sign in').click();
    cy.url().should('include', '/dashboard');
  });

  it('shows expected dashboard words', () => {
    cy.visit(baseUrl);
    cy.contains('Login').click();
    cy.get('input#email').clear().type('admin@evaide.com');
    cy.get('input#password').clear().type('dAtAbaS3w0rk!?,' , { log: false });
    cy.contains('Sign in').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Operations dashboard').should('be.visible');
    cy.contains('Overview').should('be.visible');
    cy.contains('Analytics').should('be.visible');
    cy.contains('Organization Summary').should('be.visible');
    cy.contains('Add Organization').should('be.visible');
    cy.contains('Delete Organization').should('be.visible');
    cy.contains('Edit Organization').should('be.visible');
  });
});
