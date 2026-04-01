

-- drop the old tables if you want to start fresh
DROP TABLE IF EXISTS EvidenceLink;
DROP TABLE IF EXISTS Evidence;

-- Evidence Node
-- this is the main table for storing evidence files
-- NODE makes it a graph node so we can connect files together
-- Evidence Node: Updated with tracking and status columns
CREATE TABLE Evidence (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    case_id INT NOT NULL,                                          -- which case this evidence belongs to
    evidence_type NVARCHAR(20) NOT NULL, --image, video, audio, text, document
    title NVARCHAR(255) NOT NULL,
    evidence_description NVARCHAR(500),
    source NVARCHAR(20) NOT NULL,
    uploaded_by NVARCHAR(100) NOT NULL,
    confidence_score FLOAT,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2,
    evidence_status NVARCHAR(20) --(raw, processed, analyzed)    
) AS NODE;

-- EvidenceLink Edge
-- this is how we connect evidence files together in the graph
-- EDGE makes it a connection between nodes
CREATE TABLE EvidenceLink (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    relation_type NVARCHAR(20) NOT NULL,
    confidence_score FLOAT,
    created_by NVARCHAR(10) CHECK (created_by IN ('AI', 'HUMAN')) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
) AS EDGE;

-- index to make graph queries faster
-- from_id and to_id are special columns for graph edges
CREATE INDEX idx_EvidenceLink_Graph ON EvidenceLink ($from_id, $to_id);