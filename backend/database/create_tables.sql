-- Author: Bria Tran
-- Date: November 30th, 2025
-- CORE REFERENCE TABLES
-- Defines the complete database schema, including all tables, 
-- columns, primary keys, and foreign key relationships.

-- Table: roles
CREATE TABLE roles (
    role_id INT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table: organizations
CREATE TABLE organizations (
    org_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE -- Soft Delete
);

-- USER & AUTHENTICATION TABLES

-- Table: users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    
    -- Profile Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    
    -- Authentication & Authorization
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles (role_id) ON DELETE RESTRICT,
    org_id INT REFERENCES organizations (org_id) ON DELETE SET NULL, -- NULL for EVAIDE Admin
    is_enabled BOOLEAN DEFAULT FALSE NOT NULL, -- Account must be enabled by an admin
    is_profile_complete BOOLEAN DEFAULT FALSE NOT NULL,

    -- Password Reset Functionality
    reset_token VARCHAR(255) UNIQUE,
    reset_token_expires_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Timestamps & Soft Delete
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE -- Soft Delete
);

-- Table: user_sessions (For tracking active logins and refresh tokens)
CREATE TABLE user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed Refresh Token
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    device_info VARCHAR(255), -- e.g., browser/OS information
    ip_address VARCHAR(45),
    is_valid BOOLEAN DEFAULT TRUE NOT NULL, -- Allows instant revocation
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DATA TABLES

-- Table: cases
CREATE TABLE cases (
    case_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organizations (org_id) ON DELETE CASCADE,
    created_by_user_id INT NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Open' NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE -- Soft Delete
);

-- Table: evidence
CREATE TABLE evidence (
    evidence_id SERIAL PRIMARY KEY,
    case_id INT NOT NULL REFERENCES cases (case_id) ON DELETE CASCADE,
    uploaded_by_user_id INT NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    file_path VARCHAR(255) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT AND COMPLIANCE TABLE

-- Table: audit_logs (Tracks all critical user actions for compliance)
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users (user_id) ON DELETE SET NULL, -- User who performed the action
    action_type VARCHAR(50) NOT NULL, -- e.g., LOGIN, LOGOUT, CREATE, UPDATE, DELETE
    table_name VARCHAR(100), -- The table/entity affected
    record_id INT, -- The primary key of the record affected
    old_value TEXT, -- Optional: JSON/text of old data (for UPDATEs)
    new_value TEXT, -- Optional: JSON/text of new data (for CREATEs/UPDATEs)
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);