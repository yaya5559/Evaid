-- Run these in your Azure SQL query editor

-- 1. Add agent_context column to EvidenceItem
-- This stores the note the agent types during upload
ALTER TABLE EvidenceItem
ADD agent_context NVARCHAR(MAX) NULL;

-- 2. Add reviewed_by and reviewed_at to PendingSignal if not already there
-- (already in your schema so skip if exists)
-- ALTER TABLE PendingSignal ADD reviewed_by INT NULL REFERENCES users(user_id);
-- ALTER TABLE PendingSignal ADD reviewed_at DATETIMEOFFSET NULL;

-- That's it! The triage_status column already exists with 'pending'|'confirmed'|'rejected'
-- We just change the backend to UPDATE instead of DELETE on reject
