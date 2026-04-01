SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[case_assignments]
(
  [assignment_id] [int] IDENTITY(1,1) NOT NULL,
  [case_id] [int] NOT NULL,
  [user_id] [int] NOT NULL,
  [assigned_by] [int] NOT NULL,
  [assigned_at] [datetimeoffset](7) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[case_assignments] ADD PRIMARY KEY CLUSTERED 
(
	[assignment_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_case_assignments_case_id] ON [dbo].[case_assignments]
(
	[case_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_case_assignments_user_id] ON [dbo].[case_assignments]
(
	[user_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[case_assignments] ADD  DEFAULT (sysdatetimeoffset()) FOR [assigned_at]
GO
ALTER TABLE [dbo].[case_assignments]  WITH CHECK ADD FOREIGN KEY([assigned_by])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[case_assignments]  WITH CHECK ADD FOREIGN KEY([case_id])
REFERENCES [dbo].[Cases] ([case_id])
GO
ALTER TABLE [dbo].[case_assignments]  WITH CHECK ADD FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
