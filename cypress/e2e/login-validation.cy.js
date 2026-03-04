/// <reference types="cypress" />

describe('Login form validation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/Login');
  });

  it('Sign in button is disabled when both fields are empty', () => {
    cy.get('button.btn[type="submit"]').should('be.disabled');
  });

  it('Sign in button is disabled with an invalid email', () => {
    cy.get('input#email').type('notanemail');
    cy.get('input#password').type('password123');
    cy.get('button.btn[type="submit"]').should('be.disabled');
  });

  it('Sign in button is disabled with an empty password', () => {
    cy.get('input#email').type('test@example.com');
    cy.get('button.btn[type="submit"]').should('be.disabled');
  });

  it('Sign in button is enabled with valid email and non-empty password', () => {
    cy.get('input#email').type('test@example.com');
    cy.get('input#password').type('somepassword');
    cy.get('button.btn[type="submit"]').should('not.be.disabled');
  });

  it('shows an error banner for wrong credentials', () => {
    cy.get('input#email').type('wrong@example.com');
    cy.get('input#password').type('wrongpassword');
    cy.contains('button', 'Sign in').click();
    cy.get('p.error-top', { timeout: 8000 })
      .should('be.visible')
      .and('contain', 'Invalid email or password');
  });

  it('can toggle password visibility with the Show/Hide button', () => {
    cy.get('input#password').type('mypassword');
    cy.get('input#password').should('have.attr', 'type', 'password');
    cy.contains('button', 'Show').click();
    cy.get('input#password').should('have.attr', 'type', 'text');
    cy.contains('button', 'Hide').click();
    cy.get('input#password').should('have.attr', 'type', 'password');
  });

  it('shows Forgot password link', () => {
    cy.contains('Forgot password?').should('be.visible');
  });

  it('shows terms footer text', () => {
    cy.contains('Terms & Privacy').should('be.visible');
  });
});
