SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cases]
(
  [case_id] [int] IDENTITY(1,1) NOT NULL,
  [CaseNumber] [nvarchar](50) NOT NULL,
  [title] [nvarchar](200) NULL,
  [description] [nvarchar](max) NULL,
  [created_at] [datetimeoffset](7) NULL,
  [org_id] [int] NULL,
  [created_by_user_id] [int] NULL,
  [status] [nvarchar](50) NOT NULL,
  [updated_at] [datetimeoffset](7) NULL,
  [deleted_at] [datetimeoffset](7) NULL,
  [priority] [nvarchar](20) NULL,
  [severity_level] [int] NULL,
  [due_date] [datetimeoffset](7) NULL,
  [closed_at] [datetimeoffset](7) NULL,
  [resolution] [nvarchar](max) NULL,
  [closed_by_user_id] [int] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[Cases] ADD PRIMARY KEY CLUSTERED 
(
	[case_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
ALTER TABLE [dbo].[Cases] ADD UNIQUE NONCLUSTERED 
(
	[CaseNumber] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_cases_org_id] ON [dbo].[Cases]
(
	[org_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Cases] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[Cases] ADD  DEFAULT ('Open') FOR [status]
GO
ALTER TABLE [dbo].[Cases] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[Cases] ADD  DEFAULT ('Medium') FOR [priority]
GO
ALTER TABLE [dbo].[Cases]  WITH CHECK ADD FOREIGN KEY([closed_by_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[Cases]  WITH CHECK ADD  CONSTRAINT [FK_cases_organizations] FOREIGN KEY([org_id])
REFERENCES [dbo].[organizations] ([org_id])
GO
ALTER TABLE [dbo].[Cases] CHECK CONSTRAINT [FK_cases_organizations]
GO
ALTER TABLE [dbo].[Cases]  WITH CHECK ADD  CONSTRAINT [FK_cases_users] FOREIGN KEY([created_by_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[Cases] CHECK CONSTRAINT [FK_cases_users]
GO
