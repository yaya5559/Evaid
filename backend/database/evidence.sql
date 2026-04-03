CREATE TABLE SignalTypeDefinition (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL, --
    scope NVARCHAR(50) NOT NULL, --'universal' | 'platform' | 'custom'
    platform_key NVARCHAR(100) NOT NULL, -- NULL if universal/custom
    regex_pattern NVARCHAR(500), --used for LLM optional
    llm_hint NVARCHAR(500) NOT NULL, --sent to LLM as desc
    case_id UNIQUEIDENTIFIER, --NULL = global, set = case-specific
    created_by INT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
)


CREATE TABLE PendingSignal (
    Id  UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    evidence_id         UNIQUEIDENTIFIER NOT NULL,
    attachment_id       UNIQUEIDENTIFIER NOT NULL,
    analysis_run_id     UNIQUEIDENTIFIER NOT NULL,
    signal_type         NVARCHAR(200) NOT NULL,
    raw_value           NVARCHAR(900) NOT NULL,
    normalized_value    NVARCHAR(200),
    confidence          FLOAT NOT NULL,
    char_offset_start   INT NULL,
    char_offset_end     INT NULL,
    source_locator      NVARCHAR(MAX),
    triage_reason       NVARCHAR(100),   -- 'new_type' | 'low_confidence' | 'cross_case_match'
    triage_status       NVARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending'|'confirmed'|'rejected'
    reviewed_by         INT NULL,
    reviewed_at         DATETIME NULL,
    FOREIGN KEY (evidence_id)     REFERENCES EvidenceItem(Id),
    FOREIGN KEY (attachment_id)   REFERENCES Attachment(Id),
    FOREIGN KEY (analysis_run_id) REFERENCES AnalysisRun(Id)
)

-- group of signals that refer to the same real world entity
CREATE TABLE EntityCluster (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    case_id UNIQUEIDENTIFIER NULL,
    label           NVARCHAR(200),             -- e.g. "Probably NorthernSide"
    cluster_type    NVARCHAR(100) NOT NULL DEFAULT 'unknown',  -- 'person'|'account'|'group'
    created_at      DATETIME NOT NULL DEFAULT GETUTCDATE(),
    created_by      NVARCHAR(50) NOT NULL,     -- 'AI' | 'HUMAN'
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
)

ALTER TABLE Signal ADD cluster_id UNIQUEIDENTIFIER NULL REFERENCES EntityCluster(Id)

INSERT INTO SignalTypeDefinition (name, scope, regex_pattern, llm_hint) VALUES
('email',        'universal', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',        'An email address'),
('url',          'universal', 'https?://[^\s]+',                                          'A web URL or link'),
('ip_address',   'universal', '\b\d{1,3}(\.\d{1,3}){3}\b',                               'An IPv4 address'),
('phone_number', 'universal', '(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})',        'A phone number')


--the case-scoped anchor record.
-- can exist with zero attachments
-- must not store OCR output, entities, links, or hypotheses
CREATE TABLE EvidenceItem (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    case_id UNIQUEIDENTIFIER NOT NULL,
    evidenceItem_description NVARCHAR(200),
    title NVARCHAR(200),
    created_by_user_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
    
)

--immutable after ingest
--raw thruth lives here 
--one evidenceItem can have many attachement
CREATE TABLE Attachment(
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    evidence_id UNIQUEIDENTIFIER NOT NULL,
    attachment_kind NVARCHAR(200) NOT NULL,
    file_bytes VARBINARY(MAX),
    checksum_sha256 CHAR(64),
    attachment_status NVARCHAR(100),
    captured_at DATETIME NOT NULL,
    FOREIGN KEY (evidence_id) REFERENCES EvidenceItem(Id)
)


-- process log we trued to analyze this evidence at 
--this time using this method, every asyc extraction start shere
-- do not overwrite old runs
CREATE TABLE AnalysisRun(
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),  -- auto-generates UUID for each file
    evidence_id UNIQUEIDENTIFIER NOT NULL,
    attachment_id UNIQUEIDENTIFIER NOT NULL,
    run_type NVARCHAR(200) NOT NULL,
    analysisrun_status NVARCHAR(200) NOT NULL,
    started_at DATETIME,
    finished_at DATETIME,
    error_message NVARCHAR(200),
    FOREIGN KEY (evidence_id) REFERENCES EvidenceItem(Id),
    FOREIGN KEY (attachment_id) REFERENCES Attachment(Id)
) 

CREATE TABLE Signal(
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(), 
    evidence_id UNIQUEIDENTIFIER NOT NULL,
    attachment_id UNIQUEIDENTIFIER NOT NULL,
    analysis_run_id UNIQUEIDENTIFIER NOT NULL,
    signal_type NVARCHAR(200) NOT NULL, -- platform_hint, alias, server_name
    raw_value NVARCHAR(900) NOT NULL, --exactly what etractor saw
    normalized_value NVARCHAR(200) NOT NULL, --cleaned version
    confidence FLOAT NOT NULL,
    source_locator NVARCHAR(200) NOT NULL 
)