-- Author: Bria Tran
-- Date: February 4th, 2026
--
-- NOTE: This code is still in progress and hypothetical
-- These the files/logic are for how the system COULD work once fully implemented
--
-- Database schema for the evidence management system
-- Sets up the graph structure with Evidence as nodes and EvidenceLink as edges
-- This is what creates the tables in SQL Server so we can store files
-- and connect them together like a web

-- drop the old tables if you want to start fresh
DROP TABLE IF EXISTS EvidenceLink;
DROP TABLE IF EXISTS Evidence;

-- Evidence Node
-- this is the main table for storing evidence files
-- NODE makes it a graph node so we can connect files together
-- Evidence Node: Updated with tracking and status columns
CREATE TABLE Evidence (
    FileId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    case_id INT NOT NULL,                                          -- which case this evidence belongs to
    FileName NVARCHAR(260) NOT NULL,                               -- original filename (260 is windows max path length)
    FileExtension NVARCHAR(20) NULL,                               -- .jpg, .pdf, etc
    ContentType NVARCHAR(100) NULL,                                -- MIME type like image/jpeg
    FileData VARBINARY(MAX) NOT NULL,                              -- actual file binary data stored here
    ChecksumSha256 CHAR(64) NULL,                                  -- hash of file to detect duplicates
    metadata_json NVARCHAR(MAX) NULL,                              -- stores stuff like file size, dimensions as JSON
    upload_date DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),        -- when it was uploaded
    -- NEW: Required for tracking and the preview workflow
    uploaded_by NVARCHAR(100) NULL,
    processing_status NVARCHAR(20) DEFAULT 'pending' -- 'pending', 'confirmed', 'failed'
) AS NODE;

-- EvidenceLink Edge
-- this is how we connect evidence files together in the graph
-- EDGE makes it a connection between nodes
CREATE TABLE EvidenceLink (
    connection_reason NVARCHAR(255),                               -- why these files are linked
    ai_confidence FLOAT,                                           -- how confident the AI is about the connection (0.0 to 1.0)
    -- TODO: Store why the AI linked them ({"matched_objects": ["person", "blue_car"]})
    link_metadata_json NVARCHAR(MAX) NULL                           -- extra info about the connection
) AS EDGE;

-- index to make graph queries faster
-- from_id and to_id are special columns for graph edges
CREATE INDEX idx_EvidenceLink_Graph ON EvidenceLink ($from_id, $to_id);