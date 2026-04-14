/// <reference types="cypress" />
// ── 06 · Cross-Role Access Control ───────────────────────────────────────────
// Verifies that each role is redirected away from pages they should not access,
// and that unauthenticated users are sent to /Login.
//
// Route → allowed role → redirect destination when denied:
//   /Dashboard            evaide_admin   → role's home
//   /Add_Organization     evaide_admin   → role's home
//   /Edit_Organization    evaide_admin   → role's home
//   /Register_Agent       evaide_admin   → role's home
//   /Cases                evaide_admin   → role's home
//   /Org_Dashboard        org_admin      → role's home
//   /OrgCaseProgress      org_admin      → role's home
//   /OrgStartCase         org_admin      → role's home
//   /OrgAgents            org_admin      → role's home
//   /OrgRegisterAgent     org_admin      → role's home
//   /AgentCases           agent          → role's home
//   /AgentCase/:id        agent          → role's home

let env = null;

describe('06 · Access Control', () => {
  before(function () {
    cy.task('getTestEnv').then((data) => {
      if (!data) {
        cy.log('⚠️  test-env.json not found — some blocks will be skipped');
      }
      env = data;
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  UNAUTHENTICATED — all protected routes redirect to /Login
  // ════════════════════════════════════════════════════════════════════════════
  describe('Unauthenticated user', () => {
    const protectedRoutes = [
      '/Dashboard',
      '/Add_Organization',
      '/Edit_Organization',
      '/Register_Agent',
      '/Cases',
      '/Org_Dashboard',
      '/OrgCaseProgress',
      '/OrgStartCase',
      '/OrgAgents',
      '/OrgRegisterAgent',
      '/AgentCases',
      '/Evidence_Upload',
    ];

    protectedRoutes.forEach((route) => {
      it(`redirects ${route} to /Login when not logged in`, () => {
        // Clear all sessions/cookies first
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.visit(route);
        cy.url({ timeout: 10000 }).should('include', '/Login');
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  EVAIDE ADMIN — cannot access org_admin or agent pages
  // ════════════════════════════════════════════════════════════════════════════
  describe('Evaide admin — denied routes', () => {
    beforeEach(() => cy.loginAsAdmin());

    it('redirected from /Org_Dashboard to /Dashboard', () => {
      cy.visit('/Org_Dashboard');
      cy.url({ timeout: 10000 }).should('include', '/Dashboard');
      cy.url().should('not.include', '/Org_Dashboard');
    });

    it('redirected from /OrgCaseProgress to /Dashboard', () => {
      cy.visit('/OrgCaseProgress');
      cy.url({ timeout: 10000 }).should('include', '/Dashboard');
    });

    it('redirected from /OrgStartCase to /Dashboard', () => {
      cy.visit('/OrgStartCase');
      cy.url({ timeout: 10000 }).should('include', '/Dashboard');
    });

    it('redirected from /OrgAgents to /Dashboard', () => {
      cy.visit('/OrgAgents');
      cy.url({ timeout: 10000 }).should('include', '/Dashboard');
    });

    it('redirected from /OrgRegisterAgent to /Dashboard', () => {
      cy.visit('/OrgRegisterAgent');
      cy.url({ timeout: 10000 }).should('include', '/Dashboard');
    });

    it('redirected from /AgentCases to /Dashboard', () => {
      cy.visit('/AgentCases');
      cy.url({ timeout: 10000 }).should('include', '/Dashboard');
    });

    it('redirected from /AgentCase/1 to /Dashboard', () => {
      cy.visit('/AgentCase/1');
      cy.url({ timeout: 10000 }).should('include', '/Dashboard');
    });

    it('can still access all own pages', () => {
      cy.visit('/Dashboard');
      cy.url().should('include', '/Dashboard');

      cy.visit('/Add_Organization');
      cy.url().should('include', '/Add_Organization');

      cy.visit('/Edit_Organization');
      cy.url().should('include', '/Edit_Organization');

      cy.visit('/Register_Agent');
      cy.url().should('include', '/Register_Agent');

      cy.visit('/Cases');
      cy.url().should('include', '/Cases');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  ORG ADMIN — cannot access evaide_admin or agent pages
  // ════════════════════════════════════════════════════════════════════════════
  describe('Org admin — denied routes', () => {
    before(function () {
      if (!env) this.skip();
    });

    beforeEach(function () {
      if (!env) return this.skip();
      cy.loginAs(env.ownerEmail, env.ownerPassword);
    });

    it('redirected from /Dashboard to /Org_Dashboard', function () {
      cy.visit('/Dashboard');
      cy.url({ timeout: 10000 }).should('include', '/Org_Dashboard');
    });

    it('redirected from /Add_Organization to /Org_Dashboard', function () {
      cy.visit('/Add_Organization');
      cy.url({ timeout: 10000 }).should('include', '/Org_Dashboard');
    });

    it('redirected from /Edit_Organization to /Org_Dashboard', function () {
      cy.visit('/Edit_Organization');
      cy.url({ timeout: 10000 }).should('include', '/Org_Dashboard');
    });

    it('redirected from /Register_Agent to /Org_Dashboard', function () {
      cy.visit('/Register_Agent');
      cy.url({ timeout: 10000 }).should('include', '/Org_Dashboard');
    });

    it('redirected from /Cases to /Org_Dashboard', function () {
      cy.visit('/Cases');
      cy.url({ timeout: 10000 }).should('include', '/Org_Dashboard');
    });

    it('redirected from /AgentCases to /Org_Dashboard', function () {
      cy.visit('/AgentCases');
      cy.url({ timeout: 10000 }).should('include', '/Org_Dashboard');
    });

    it('redirected from /AgentCase/1 to /Org_Dashboard', function () {
      cy.visit('/AgentCase/1');
      cy.url({ timeout: 10000 }).should('include', '/Org_Dashboard');
    });

    it('can still access all own pages', function () {
      cy.visit('/Org_Dashboard');
      cy.url().should('include', '/Org_Dashboard');

      cy.visit('/OrgCaseProgress');
      cy.url().should('include', '/OrgCaseProgress');

      cy.visit('/OrgStartCase');
      cy.url().should('include', '/OrgStartCase');

      cy.visit('/OrgAgents');
      cy.url().should('include', '/OrgAgents');

      cy.visit('/OrgRegisterAgent');
      cy.url().should('include', '/OrgRegisterAgent');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  AGENT — cannot access evaide_admin or org_admin pages
  // ════════════════════════════════════════════════════════════════════════════
  describe('Agent — denied routes', () => {
    before(function () {
      if (!env) this.skip();
    });

    beforeEach(function () {
      if (!env) return this.skip();
      cy.loginAs(env.agentEmail, env.agentPassword);
    });

    it('redirected from /Dashboard to /AgentCases', function () {
      cy.visit('/Dashboard');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /Add_Organization to /AgentCases', function () {
      cy.visit('/Add_Organization');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /Edit_Organization to /AgentCases', function () {
      cy.visit('/Edit_Organization');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /Register_Agent to /AgentCases', function () {
      cy.visit('/Register_Agent');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /Cases to /AgentCases', function () {
      cy.visit('/Cases');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /Org_Dashboard to /AgentCases', function () {
      cy.visit('/Org_Dashboard');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /OrgCaseProgress to /AgentCases', function () {
      cy.visit('/OrgCaseProgress');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /OrgStartCase to /AgentCases', function () {
      cy.visit('/OrgStartCase');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /OrgAgents to /AgentCases', function () {
      cy.visit('/OrgAgents');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('redirected from /OrgRegisterAgent to /AgentCases', function () {
      cy.visit('/OrgRegisterAgent');
      cy.url({ timeout: 10000 }).should('include', '/AgentCases');
    });

    it('can still access own pages', function () {
      cy.visit('/AgentCases');
      cy.url().should('include', '/AgentCases');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  API-LEVEL ACCESS CONTROL
  // Verify the backend also enforces role restrictions, not just the frontend.
  // ════════════════════════════════════════════════════════════════════════════
  describe('API access control', () => {
    it('unauthenticated request to /Organization returns 401 or 403', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:8000/Evaide/Organization',
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403]);
      });
    });

    it('unauthenticated request to /org/dashboard/summary returns 401 or 403', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:8000/Evaide/org/dashboard/summary',
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403]);
      });
    });

    it('unauthenticated request to /agent/cases/ returns 401 or 403', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:8000/Evaide/agent/cases/',
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403]);
      });
    });
  });
});