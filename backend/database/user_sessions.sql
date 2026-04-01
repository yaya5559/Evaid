SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_sessions]
(
  [session_id] [int] IDENTITY(1,1) NOT NULL,
  [user_id] [int] NOT NULL,
  [token_hash] [nvarchar](255) NOT NULL,
  [expires_at] [datetimeoffset](7) NOT NULL,
  [device_info] [nvarchar](255) NULL,
  [ip_address] [nvarchar](45) NULL,
  [is_valid] [bit] NOT NULL,
  [created_at] [datetimeoffset](7) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[user_sessions] ADD PRIMARY KEY CLUSTERED 
(
	[session_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
ALTER TABLE [dbo].[user_sessions] ADD UNIQUE NONCLUSTERED 
(
	[token_hash] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_sessions_token_active] ON [dbo].[user_sessions]
(
	[token_hash] ASC
)
WHERE ([is_valid]=(1))
WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[user_sessions] ADD  DEFAULT ((1)) FOR [is_valid]
GO
ALTER TABLE [dbo].[user_sessions] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[user_sessions]  WITH CHECK ADD FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
