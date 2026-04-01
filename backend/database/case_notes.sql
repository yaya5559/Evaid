SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[case_notes]
(
  [note_id] [int] IDENTITY(1,1) NOT NULL,
  [case_id] [int] NOT NULL,
  [created_by_user_id] [int] NOT NULL,
  [content] [nvarchar](max) NOT NULL,
  [created_at] [datetimeoffset](7) NULL,
  [updated_at] [datetimeoffset](7) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[case_notes] ADD PRIMARY KEY CLUSTERED 
(
	[note_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_case_notes_case_id] ON [dbo].[case_notes]
(
	[case_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[case_notes] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[case_notes] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[case_notes]  WITH CHECK ADD FOREIGN KEY([case_id])
REFERENCES [dbo].[Cases] ([case_id])
GO
ALTER TABLE [dbo].[case_notes]  WITH CHECK ADD FOREIGN KEY([created_by_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
