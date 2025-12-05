-- Author: Bria Tran
-- Date: November 30th, 2025
-- Populates the database with essential starting data, 
-- including system roles and the initial system administrator account.

-- Insert initial Roles.
-- Uses CHECK to ensure roles are only inserted once.
-- We must enable IDENTITY_INSERT to manually set the fixed role_id values.
SET IDENTITY_INSERT roles ON;

IF NOT EXISTS (SELECT 1 FROM roles WHERE role_id = 1)
    INSERT INTO roles (role_id, role_name) VALUES (1, 'EVAIDE_ADMIN');
IF NOT EXISTS (SELECT 1 FROM roles WHERE role_id = 2)
    INSERT INTO roles (role_id, role_name) VALUES (2, 'ORG_ADMIN');
IF NOT EXISTS (SELECT 1 FROM roles WHERE role_id = 3)
    INSERT INTO roles (role_id, role_name) VALUES (3, 'AGENT');

SET IDENTITY_INSERT roles OFF;

-- Insert the root EVAIDE Organization.
-- Checks if the organization name already exists before inserting.
IF NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'EVAIDE Central Administration')
BEGIN
    INSERT INTO organizations (name, description, is_active) VALUES
    ('EVAIDE Central Administration', 'The root organization for managing all client organizations.', 1); -- BIT uses 1 for TRUE
END

-- Insert the initial EVAIDE Admin User.
-- Checks if the admin email already exists before inserting.
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@evaide.com')
BEGIN
    INSERT INTO users (email, password_hash, first_name, last_name, org_id, role_id, is_enabled, is_profile_complete) VALUES
    (
        'admin@evaide.com',
        'YOUR_SECURE_HASH', -- Placeholder: Replace with a secure hash
        'System',
        'Admin',
        (SELECT org_id FROM organizations WHERE name = 'EVAIDE Central Administration'), -- Dynamically set the organization ID
        1, -- role_id: EVAIDE_ADMIN
        1, -- is_enabled: 1 for TRUE
        1  -- is_profile_complete: 1 for TRUE
    );
END