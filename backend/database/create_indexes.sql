-- Author: Bria Tran
-- Date: November 30th, 2025
-- Creates database indexes on frequently accessed columns 
-- to optimize query performance and speed up data retrieval.

-- USER AND AUTHENTICATION INDEXES
-- Index on the email column for fast login lookups
CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL; -- Ensures unique active users

-- Index on the reset token for quick and unique lookup during password reset
CREATE UNIQUE INDEX idx_users_reset_token ON users (reset_token);

-- Index on the session token for quick session validation
CREATE UNIQUE INDEX idx_sessions_token_hash ON user_sessions (token_hash);

-- Index on the org_id and role_id for efficiently listing all users within an organization
CREATE INDEX idx_users_org_role ON users (org_id, role_id);

-- DATA TABLE INDEXES
-- Index for quickly listing cases by organization
CREATE INDEX idx_cases_org_id ON cases (org_id);

-- AUDIT LOG INDEXES
-- Index for quick lookups by user and action type
CREATE INDEX idx_audit_logs_user_action ON audit_logs (user_id, action_type);