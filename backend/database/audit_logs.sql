SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[audit_logs]
(
  [log_id] [bigint] IDENTITY(1,1) NOT NULL,
  [user_id] [int] NULL,
  [action_type] [nvarchar](50) NOT NULL,
  [table_name] [nvarchar](100) NULL,
  [record_id] [int] NULL,
  [old_value] [nvarchar](max) NULL,
  [new_value] [nvarchar](max) NULL,
  [ip_address] [nvarchar](45) NULL,
  [timestamp] [datetimeoffset](7) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[audit_logs] ADD PRIMARY KEY CLUSTERED 
(
	[log_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[audit_logs] ADD  DEFAULT (sysdatetimeoffset()) FOR [timestamp]
GO
ALTER TABLE [dbo].[audit_logs]  WITH CHECK ADD FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE SET NULL
GO
