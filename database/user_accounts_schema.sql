-- Employee-linked account lifecycle for Identity & Access Management.
-- Safe to run more than once. Runtime startup performs the same migration.

IF COL_LENGTH('Users', 'EmployeeId') IS NULL ALTER TABLE Users ADD EmployeeId INT NULL;
IF COL_LENGTH('Users', 'MustChangePassword') IS NULL ALTER TABLE Users ADD MustChangePassword BIT NOT NULL CONSTRAINT DF_Users_MustChangePassword DEFAULT 0;
IF COL_LENGTH('Users', 'IsActive') IS NULL ALTER TABLE Users ADD IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1;
IF COL_LENGTH('Users', 'IsSystemAccount') IS NULL ALTER TABLE Users ADD IsSystemAccount BIT NOT NULL CONSTRAINT DF_Users_IsSystemAccount DEFAULT 0;
IF COL_LENGTH('Users', 'PasswordChangedAt') IS NULL ALTER TABLE Users ADD PasswordChangedAt DATETIME2 NULL;
IF COL_LENGTH('Users', 'PasswordResetAt') IS NULL ALTER TABLE Users ADD PasswordResetAt DATETIME2 NULL;
IF COL_LENGTH('Users', 'LastLoginAt') IS NULL ALTER TABLE Users ADD LastLoginAt DATETIME2 NULL;
IF COL_LENGTH('Users', 'FailedLoginAttempts') IS NULL ALTER TABLE Users ADD FailedLoginAttempts INT NOT NULL CONSTRAINT DF_Users_FailedLoginAttempts DEFAULT 0;
IF COL_LENGTH('Users', 'LockedUntil') IS NULL ALTER TABLE Users ADD LockedUntil DATETIME2 NULL;
IF COL_LENGTH('Users', 'TokenVersion') IS NULL ALTER TABLE Users ADD TokenVersion INT NOT NULL CONSTRAINT DF_Users_TokenVersion DEFAULT 0;
IF COL_LENGTH('Users', 'UpdatedAt') IS NULL ALTER TABLE Users ADD UpdatedAt DATETIME2 NULL;

UPDATE Users SET IsSystemAccount = 1, EmployeeId = NULL, MustChangePassword = 0
WHERE LOWER(UserName) = 'superadmin';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Users') AND name = 'UX_Users_EmployeeId')
    CREATE UNIQUE INDEX UX_Users_EmployeeId ON Users(EmployeeId) WHERE EmployeeId IS NOT NULL;
