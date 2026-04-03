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

describe('Edit Organization fallback', () => {
  beforeEach(() => {
    loginAsAdmin();
  });

  it('loads demo organizations when list API fails and shows corrected status card', () => {
    cy.intercept('GET', '**/Organization', {
      statusCode: 500,
      body: { detail: 'Simulated list failure' },
    }).as('organizationListFail');

    cy.contains('a', 'Edit Organization').click();
    cy.url().should('include', '/Edit_Organization');
    cy.wait('@organizationListFail');

    cy.contains('Live edit endpoints are unavailable. You are currently using demo organization data.').should('be.visible');
    cy.contains('Metro Intelligence Unit').should('be.visible');
    cy.contains('Current Status').should('be.visible');
    cy.contains('Open Cases').should('not.exist');

    cy.get('.edit-org-editor-panel .edit-org-panel-head').first().invoke('text').then((text) => {
      expect(text.trim()).not.to.match(/^c[A-Z]/);
    });
  });
});
