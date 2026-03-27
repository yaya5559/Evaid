SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ai_suggestions]
(
  [suggestion_id] [int] IDENTITY(1,1) NOT NULL,
  [case_id] [int] NOT NULL,
  [primary_evidence_id] [uniqueidentifier] NULL,
  [related_evidence_ids] [nvarchar](max) NULL,
  [suggestion_type] [nvarchar](100) NOT NULL,
  [title] [nvarchar](255) NOT NULL,
  [content] [nvarchar](max) NOT NULL,
  [confidence_score] [decimal](5, 2) NULL,
  [status] [nvarchar](50) NOT NULL,
  [reviewed_by_user_id] [int] NULL,
  [reviewed_at] [datetimeoffset](7) NULL,
  [user_feedback] [nvarchar](max) NULL,
  [ai_model_version] [nvarchar](50) NULL,
  [generation_metadata] [nvarchar](max) NULL,
  [created_at] [datetimeoffset](7) NULL,
  [updated_at] [datetimeoffset](7) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[ai_suggestions] ADD PRIMARY KEY CLUSTERED 
(
	[suggestion_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_ai_suggestions_case_id] ON [dbo].[ai_suggestions]
(
	[case_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_ai_suggestions_evidence_id] ON [dbo].[ai_suggestions]
(
	[primary_evidence_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_ai_suggestions_status] ON [dbo].[ai_suggestions]
(
	[status] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[ai_suggestions] ADD  DEFAULT ('Pending') FOR [status]
GO
ALTER TABLE [dbo].[ai_suggestions] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[ai_suggestions] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[ai_suggestions]  WITH CHECK ADD FOREIGN KEY([case_id])
REFERENCES [dbo].[Cases] ([case_id])
GO
ALTER TABLE [dbo].[ai_suggestions]  WITH CHECK ADD FOREIGN KEY([primary_evidence_id])
REFERENCES [dbo].[Evidence] ([FileId])
GO
ALTER TABLE [dbo].[ai_suggestions]  WITH CHECK ADD FOREIGN KEY([reviewed_by_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
