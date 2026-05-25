-- Author: Bria Tran
-- Date: November 30th, 2025
-- CORE REFERENCE TABLES FOR THE APPLICATION
-- The main database schema including all tables, 
-- columns, primary keys, and foreign key relationships

-- Table: roles
CREATE TABLE roles (
    role_id INT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table: organizations
CREATE TABLE organizations (
    org_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    phone_number NVARCHAR(20) UNIQUE NOT NULL,
    owner_id INT NULL, -- Owner not added yet
    description NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    deleted_at DATETIMEOFFSET NULL -- for soft Delete
);

-- Table: users (works with auth.py)
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL, -- used for login lookup
    password_hash NVARCHAR(255) NOT NULL, -- password verified by auth
    phone_number NVARCHAR(20),
    profile_picture NVARCHAR(MAX) NULL,
    role_id INT NOT NULL FOREIGN KEY REFERENCES roles (role_id),
    org_id INT FOREIGN KEY REFERENCES organizations (org_id),
    is_enabled BIT DEFAULT 0 NOT NULL,
    is_profile_complete BIT DEFAULT 0 NOT NULL,
    reset_token NVARCHAR(255) UNIQUE NULL,
    reset_token_expires_at DATETIMEOFFSET NULL,
    last_login_at DATETIMEOFFSET NULL, -- tracks user activity
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    deleted_at DATETIMEOFFSET NULL -- for soft Delete
);

-- Table: user_sessions (stores the refresh tokens)
CREATE TABLE user_sessions (
    session_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES users (user_id) ON DELETE CASCADE,
    token_hash NVARCHAR(255) UNIQUE NOT NULL, -- hased refresh token
    expires_at DATETIMEOFFSET NOT NULL,
    device_info NVARCHAR(255),
    ip_address NVARCHAR(45),
    is_valid BIT DEFAULT 1 NOT NULL,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- Table: cases (stores organizations case information)
CREATE TABLE cases (
    case_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    org_id INT NOT NULL FOREIGN KEY REFERENCES organizations (org_id),
    created_by_user_id INT NOT NULL FOREIGN KEY REFERENCES users (user_id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'Open' NOT NULL,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    deleted_at DATETIMEOFFSET NULL
);

-- Table: Notes for cases 
CREATE TABLE case_notes(
    note_id INT IDENTITY(1,1) PRIMARY KEY,
    case_id INT NOT NULL FOREIGN KEY REFERENCES cases(case_id),
    created_by_user_id INT NOT NULL FOREIGN KEY REFERENCES users(user_id),
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- Table: This allows 
CREATE TABLE case_assignments
(
    assignment_id INT IDENTITY(1,1) PRIMARY KEY,
    case_id INT NOT NULL FOREIGN KEY REFERENCES cases(case_id),
    user_id INT NOT NULL FOREIGN KEY REFERENCES users(user_id),
    assigned_by INT NOT NULL FOREIGN KEY REFERENCES users(user_id),
    assigned_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

CREATE INDEX idx_case_assignments_user_id ON case_assignments (user_id);
CREATE INDEX idx_case_assignments_case_id ON case_assignments (case_id);

CREATE INDEX idx_case_notes_case_id ON case_notes (case_id);

-- AI Suggestions Table
-- Stores AI-generated insights and recommendations based on evidence analysis
CREATE TABLE ai_suggestions
(
    suggestion_id INT IDENTITY(1,1) PRIMARY KEY,
    case_id INT NOT NULL FOREIGN KEY REFERENCES cases(case_id),

    -- Link to evidence (can be one or multiple)
    primary_evidence_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Evidence(FileId),
    related_evidence_ids NVARCHAR(MAX),
    -- JSON array of FileIds if suggestion spans multiple evidence

    -- Suggestion details
    suggestion_type NVARCHAR(100) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    confidence_score DECIMAL(5,2),

    -- User interaction tracking
    status NVARCHAR(50) DEFAULT 'Pending' NOT NULL,
    reviewed_by_user_id INT FOREIGN KEY REFERENCES users(user_id),
    reviewed_at DATETIMEOFFSET NULL,
    user_feedback NVARCHAR(MAX),

    -- AI metadata
    ai_model_version NVARCHAR(50),
    generation_metadata NVARCHAR(MAX),

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- Create indexes for better query performance
CREATE INDEX idx_ai_suggestions_case_id ON ai_suggestions(case_id);
CREATE INDEX idx_ai_suggestions_evidence_id ON ai_suggestions(primary_evidence_id);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);


-- Table: audit_logs (tracks actions like login/logout and other actions)
CREATE TABLE audit_logs (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users (user_id) ON DELETE SET NULL,
    action_type NVARCHAR(50) NOT NULL, -- like 'login' 'logout' 'update_record' etc
    table_name NVARCHAR(100),
    record_id INT,
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    ip_address NVARCHAR(45),
    timestamp DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE CaseCorrelation (
    correlation_id INT IDENTITY(1,1) PRIMARY KEY,
    case_id_a NVARCHAR(50) NOT NULL,
    case_id_b NVARCHAR(50) NOT NULL,
    signal_type NVARCHAR(100) NOT NULL,
    shared_value NVARCHAR(900) NOT NULL,
    confidence FLOAT NOT NULL,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);



ALTER TABLE organizations
ADD CONSTRAINT FK_organizations_owner
FOREIGN KEY (owner_id) REFERENCES users(user_id);