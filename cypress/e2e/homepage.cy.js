/// <reference types="cypress" />

describe('Home page content and navigation', () => {
  const baseUrl = 'http://localhost:5173/';

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  it('has all homepage clickable buttons', () => {
    cy.get('[data-cy="nav-home"]').should('be.visible');
    cy.get('[data-cy="nav-features"]').should('be.visible');
    cy.get('[data-cy="nav-contact"]').should('be.visible');
    cy.get('[data-cy="nav-learn-more"]').should('be.visible');
    cy.get('[data-cy="nav-login"]').should('be.visible');
    cy.get('[data-cy="cta-get-started"]').should('be.visible');
    cy.get('[data-cy="cta-see-features"]').should('be.visible');
  });

  it('shows required words on the homepage', () => {
    cy.get('[data-cy="section-home"]').within(() => {
      cy.contains('Investigations').should('be.visible');
      cy.contains('case memory').should('be.visible');
      cy.contains('faster link discovery').should('be.visible');
      cy.contains('AI Evidence Assistant').should('be.visible');
    });
  });

  it('shows required words on the Features section', () => {
    cy.get('[data-cy="section-features"]').scrollIntoView();
    cy.get('[data-cy="section-features"]').within(() => {
      cy.contains('What is Evaide').should('be.visible');
      cy.contains('Unified Evidence Vault').should('be.visible');
      cy.contains('AI Connections').should('be.visible');
      cy.contains('Query in Plain English').should('be.visible');
      cy.contains('Secure by Default').should('be.visible');
      cy.contains('Integrations').should('be.visible');
      cy.contains('Audit & Reporting').should('be.visible');
    });
  });

  it('shows required words on Contact section', () => {
    cy.get('[data-cy="section-contact"]').scrollIntoView();
    cy.get('[data-cy="section-contact"]').within(() => {
      cy.contains('Contact').should('be.visible');
      cy.contains('Evaide').should('be.visible');
      cy.contains('evaide@example.com').should('be.visible');
      cy.contains('Phone: (000) 000-0000').should('be.visible');
      cy.contains('2026 EVAIDE. All rights reserved.').should('be.visible');
    });
  });

  it('shows required words on Learn More section', () => {
    cy.get('[data-cy="nav-learn-more"]').click();
    cy.get('[data-cy="section-features"]').within(() => {
      cy.contains('What is Evaide').should('be.visible');
      cy.contains('Unified Evidence Vault').should('be.visible');
      cy.contains('AI Connections').should('be.visible');
      cy.contains('Query in Plain English').should('be.visible');
      cy.contains('Secure by Default').should('be.visible');
      cy.contains('Integrations').should('be.visible');
      cy.contains('Audit & Reporting').should('be.visible');
    });
  });

  it('shows required words on See features section', () => {
    cy.get('[data-cy="cta-see-features"]').click();
    cy.get('[data-cy="section-features"]').within(() => {
      cy.contains('What is Evaide').should('be.visible');
      cy.contains('Unified Evidence Vault').should('be.visible');
      cy.contains('AI Connections').should('be.visible');
      cy.contains('Query in Plain English').should('be.visible');
      cy.contains('Secure by Default').should('be.visible');
      cy.contains('Integrations').should('be.visible');
      cy.contains('Audit & Reporting').should('be.visible');
    });
  });
});
