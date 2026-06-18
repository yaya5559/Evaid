IF COL_LENGTH('dbo.users', 'profile_picture') IS NULL
BEGIN
    ALTER TABLE dbo.users
    ADD [profile_picture] NVARCHAR(MAX) NULL;
END
