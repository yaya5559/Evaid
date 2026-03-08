SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Evidence]
(
  [FileId] [uniqueidentifier] NOT NULL,
  [case_id] [int] NOT NULL,
  [FileName] [nvarchar](260) NOT NULL,
  [FileExtension] [nvarchar](20) NULL,
  [ContentType] [nvarchar](100) NULL,
  [FileData] [varbinary](max) NOT NULL,
  [ChecksumSha256] [char](64) NULL,
  [metadata_json] [nvarchar](max) NULL,
  [upload_date] [datetimeoffset](7) NULL,
  [uploaded_by] [nvarchar](100) NULL,
  [processing_status] [nvarchar](20) NULL
)
AS NODE ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[Evidence] ADD PRIMARY KEY CLUSTERED 
(
	[FileId] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE UNIQUE NONCLUSTERED INDEX [GRAPH_UNIQUE_INDEX_589D55D2A6FE41058369A84BE5E52FD2] ON [dbo].[Evidence]
(
	$node_id
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_Evidence_case_id] ON [dbo].[Evidence]
(
	[case_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_Evidence_CaseId] ON [dbo].[Evidence]
(
	[case_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Evidence] ADD  DEFAULT (newid()) FOR [FileId]
GO
ALTER TABLE [dbo].[Evidence] ADD  DEFAULT (sysdatetimeoffset()) FOR [upload_date]
GO
ALTER TABLE [dbo].[Evidence] ADD  DEFAULT ('pending') FOR [processing_status]
GO
ALTER TABLE [dbo].[Evidence]  WITH CHECK ADD  CONSTRAINT [FK_Evidence_Case] FOREIGN KEY([case_id])
REFERENCES [dbo].[Cases] ([case_id])
GO
ALTER TABLE [dbo].[Evidence] CHECK CONSTRAINT [FK_Evidence_Case]
GO
ALTER TABLE [dbo].[Evidence]  WITH CHECK ADD  CONSTRAINT [FK_Evidence_Cases] FOREIGN KEY([case_id])
REFERENCES [dbo].[Cases] ([case_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Evidence] CHECK CONSTRAINT [FK_Evidence_Cases]
GO
