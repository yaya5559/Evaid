SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users]
(
  [user_id] [int] IDENTITY(1,1) NOT NULL,
  [first_name] [nvarchar](100) NOT NULL,
  [last_name] [nvarchar](100) NOT NULL,
  [email] [nvarchar](255) NOT NULL,
  [password_hash] [nvarchar](255) NOT NULL,
  [phone_number] [nvarchar](20) NULL,
  [profile_picture] [nvarchar](max) NULL,
  [role_id] [int] NOT NULL,
  [org_id] [int] NULL,
  [is_enabled] [bit] NOT NULL,
  [is_profile_complete] [bit] NOT NULL,
  [reset_token] [nvarchar](255) NULL,
  [reset_token_expires_at] [datetimeoffset](7) NULL,
  [last_login_at] [datetimeoffset](7) NULL,
  [created_at] [datetimeoffset](7) NULL,
  [updated_at] [datetimeoffset](7) NULL,
  [deleted_at] [datetimeoffset](7) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[users] ADD PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE UNIQUE NONCLUSTERED INDEX [idx_users_email_active] ON [dbo].[users]
(
	[email] ASC
)
WHERE ([deleted_at] IS NULL)
WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_users_org_role] ON [dbo].[users]
(
	[org_id] ASC,
	[role_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT ((0)) FOR [is_enabled]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT ((0)) FOR [is_profile_complete]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD FOREIGN KEY([org_id])
REFERENCES [dbo].[organizations] ([org_id])
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD FOREIGN KEY([role_id])
REFERENCES [dbo].[roles] ([role_id])
GO
