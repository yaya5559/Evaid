


--the case-scoped anchor record.
-- can exist with zero attachments
-- must not store OCR output, entities, links, or hypotheses
CREATE TABLE EvidenceItem (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    case_id UNIQUEIDENTIFIER NOT NULL,
    evidenceItem_description NVARCHAR(200),
    title NVARCHAR(20),
    created_by_user_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY case_id REFERENCES cases(case_id),
    FOREIGN KEY created_by_user_id REFERENCES users(user_id)
    
)

--immutable after ingest
--raw thruth lives here 
--one evidenceItem can have many attachement
CREATE TABLE Attachment(
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    evidence_id UNIQUEIDENTIFIER NOT NULL,
    attachment_kind NVARCHAR(200) NOT NULL,
    storage_url VARCHAR (100),
    checksum_sha256 CHAR(64),
    attachment_status NVARCHAR(100),
    captured_at DATETIME NOT NULL,
    FOREIGN KEY evidence_id REFERENCES EvidenceItem(Id),
)


-- process log we trued to analyze this evidence at 
--this time using this method, every asyc extraction start shere
-- do not overwrite old runs
CREATE TABLE AnalysisRun(
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    evidence_id UNIQUEIDENTIFIER NOT NULL,
    attachment_id UNIQUEIDENTIFIER NOT NULL,
    run_type NVARCHAR(200) NOT NULL,
    analysisrun_status NVARCHAR(200),
    started_at DATETIME NOT NULL,
    finished_at DATETIME NOT NULL,
    error_message NVARCHAR(200),
    FOREIGN KEY evidence_id REFERENCES EvidenceItem(Id),
    FOREIGN KEY attachment_id REFERENCES Attachment(Id)

) 
