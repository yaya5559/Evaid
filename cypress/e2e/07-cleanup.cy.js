/// <reference types="cypress" />
// ── 07 · Cleanup ─────────────────────────────────────────────────────────────
// Deletes the test organization (and all its users/cases/data via cascade)
// that was created by 03-evaide-admin.cy.js.
//
// This spec MUST run last to avoid leaving stale data in the database.
// It uses the evaide_admin account to authenticate and calls the backend DELETE
// endpoint directly via cy.request() — no UI interaction needed.
//
// After deletion, test-env.json is cleared so the next run starts fresh.

const API = 'http://localhost:8000/Evaide';

let env = null;
let accessToken = null;

describe('07 · Cleanup — delete test organization', () => {
  before(function () {
    cy.task('getTestEnv').then((data) => {
      if (!data) {
        cy.log('⚠️  test-env.json not found — nothing to clean up');
        this.skip();
      }
      env = data;
    });
  });

  // ── Acquire an evaide_admin access token via the API ──────────────────────
  it('authenticates as evaide_admin', function () {
    if (!env) return this.skip();

    cy.request({
      method: 'POST',
      url: `${API}/auth/login`,
      body: { email: 'admin@evaide.com', password: 'dAtAbaS3w0rk!?,' },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('accessToken');
      accessToken = res.body.accessToken;
    });
  });

  // ── Verify the test org exists before deleting ────────────────────────────
  it('confirms test org exists in the organization list', function () {
    if (!env || !accessToken) return this.skip();

    cy.request({
      method: 'GET',
      url: `${API}/Organization`,
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const orgs = res.body.organizations ?? res.body;
      const match = Array.isArray(orgs)
        ? orgs.find((o) => (o.companyName ?? o.name) === env.orgName)
        : null;
      expect(match, `Organization "${env.orgName}" should exist before deletion`).to.exist;
    });
  });

  // ── Delete the test organization ──────────────────────────────────────────
  it('deletes the test organization via the API', function () {
    if (!env || !accessToken) return this.skip();

    cy.request({
      method: 'DELETE',
      url: `${API}/Organization/Delete`,
      qs: { name: env.orgName },
      headers: { Authorization: `Bearer ${accessToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      // "Success" body or 200/204 — either means it worked
      expect(res.status).to.be.oneOf([200, 204]);
    });
  });

  // ── Verify the org is gone ────────────────────────────────────────────────
  it('confirms test org no longer appears in the organization list', function () {
    if (!env || !accessToken) return this.skip();

    cy.request({
      method: 'GET',
      url: `${API}/Organization`,
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const orgs = res.body.organizations ?? res.body;
      if (Array.isArray(orgs)) {
        const match = orgs.find((o) => (o.companyName ?? o.name) === env.orgName);
        expect(match, `Organization "${env.orgName}" should be gone after deletion`).to.be.undefined;
      }
    });
  });

  // ── Verify the test org is gone from the UI as well ──────────────────────
  it('test org does not appear on the Edit Organization page', function () {
    if (!env) return this.skip();

    cy.loginAsAdmin();
    cy.visit('/Edit_Organization');
    cy.get('body', { timeout: 15000 }).then(($body) => {
      expect($body.text()).not.to.include(env.orgName);
    });
  });

  // ── Clean up the local test-env.json ─────────────────────────────────────
  it('clears test-env.json so the next run starts fresh', function () {
    cy.task('clearTestEnv');
  });
});