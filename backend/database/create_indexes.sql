-- Author: Bria Tran
-- Date: November 30th, 2025
-- Creates database indexes on frequently accessed columns 
-- to optimize query performance and speed up data retrieval

-- Login lookup (only searches active users)
CREATE UNIQUE INDEX idx_users_email_active 
ON users (email) 
WHERE deleted_at IS NULL;

-- Session validation for token checks
CREATE INDEX idx_sessions_token_active 
ON user_sessions (token_hash) 
WHERE is_valid = 1;

-- Optimized lookups for organization and case lookups
CREATE INDEX idx_users_org_role ON users (org_id, role_id);
CREATE INDEX idx_cases_org_id ON cases (org_id);