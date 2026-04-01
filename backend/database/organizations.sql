SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[organizations]
(
  [org_id] [int] IDENTITY(1,1) NOT NULL,
  [name] [varchar](255) NOT NULL,
  [description] [nvarchar](max) NULL,
  [is_active] [bit] NULL,
  [created_at] [datetimeoffset](7) NULL,
  [updated_at] [datetimeoffset](7) NULL,
  [deleted_at] [datetimeoffset](7) NULL,
  [primary_admin_id] [int] NULL,
  [email] [nvarchar](255) NOT NULL,
  [phone_number] [nvarchar](20) NOT NULL,
  [owner_id] [int] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[organizations] ADD PRIMARY KEY CLUSTERED 
(
	[org_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
ALTER TABLE [dbo].[organizations] ADD UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
ALTER TABLE [dbo].[organizations] ADD  CONSTRAINT [UQ_organizations_email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
ALTER TABLE [dbo].[organizations] ADD  CONSTRAINT [UQ_organizations_phone] UNIQUE NONCLUSTERED 
(
	[phone_number] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[organizations] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[organizations] ADD  DEFAULT (sysdatetimeoffset()) FOR [created_at]
GO
ALTER TABLE [dbo].[organizations] ADD  DEFAULT (sysdatetimeoffset()) FOR [updated_at]
GO
ALTER TABLE [dbo].[organizations]  WITH CHECK ADD FOREIGN KEY([primary_admin_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[organizations]  WITH CHECK ADD  CONSTRAINT [FK_organizations_owner] FOREIGN KEY([owner_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[organizations] CHECK CONSTRAINT [FK_organizations_owner]
GO
