/// <reference types="cypress" />
// ── 01 · Docker / Service Health ─────────────────────────────────────────────
// Verifies that both the backend (FastAPI on :8000) and frontend (Vite/:nginx
// on :5173) are up and responding before any functional tests run.
// If these fail, the remaining suites will also fail — investigate Docker first.

const BACKEND  = 'http://localhost:8000/Evaide';
const FRONTEND = 'http://localhost:5173';

describe('Service health checks', () => {
  it('backend responds to GET /Evaide/auth/refresh (405 = alive)', () => {
    // The refresh endpoint is POST-only, so a GET returns 405.
    // Any response that isn't a network error means the server is up.
    cy.request({
      method: 'GET',
      url: `${BACKEND}/auth/refresh`,
      failOnStatusCode: false,
      retryOnStatusCodeFailure: false,
      timeout: 30000,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 405, 422, 401, 403]);
    });
  });

  it('backend login endpoint accepts POST requests', () => {
    // Posting bad credentials should yield 401, not a network error.
    cy.request({
      method: 'POST',
      url: `${BACKEND}/auth/login`,
      body: { email: 'health@check.com', password: 'healthcheck' },
      failOnStatusCode: false,
      timeout: 30000,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 401, 422]);
    });
  });

  it('frontend loads the home page', () => {
    cy.visit(FRONTEND, { timeout: 30000 });
    cy.get('body').should('be.visible');
  });

  it('frontend serves the Login page', () => {
    cy.visit(`${FRONTEND}/Login`, { timeout: 30000 });
    cy.contains('Sign in').should('be.visible');
  });

  it('evaide_admin login works end-to-end', () => {
    cy.request({
      method: 'POST',
      url: `${BACKEND}/auth/login`,
      body: { email: 'admin@evaide.com', password: 'dAtAbaS3w0rk!?,' },
      failOnStatusCode: false,
      timeout: 30000,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('accessToken');
    });
  });
});