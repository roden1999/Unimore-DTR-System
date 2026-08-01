-- ============================================================
-- Unimore - Production Coil / Skelp inventory
-- Coil and Skelp records use separate tables and API resources.
-- Run after database/schema.sql.
-- ============================================================

USE UnimoreDBR;
GO

IF OBJECT_ID('dbo.Coils', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Coils (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        SkelpNo NVARCHAR(200) NOT NULL,
        SlitFormNo NVARCHAR(100) NULL,
        [Date] DATETIME2 NOT NULL DEFAULT GETDATE(),
        ProdFormNo NVARCHAR(100) NULL,
        HSPrime NVARCHAR(100) NULL,
        Thickness FLOAT NOT NULL DEFAULT 0,
        Width FLOAT NOT NULL DEFAULT 0,
        [Weight] FLOAT NOT NULL DEFAULT 0,
        WeightBefProc FLOAT NOT NULL DEFAULT 0,
        FGtoProduce NVARCHAR(200) NULL,
        LengthofFg FLOAT NOT NULL DEFAULT 0,
        Remarks NVARCHAR(1000) NULL,
        [Status] NVARCHAR(100) NOT NULL DEFAULT 'Unprocessed',
        DateProcessed DATETIME2 NULL,
        Operator NVARCHAR(200) NULL,
        OtherRemarks NVARCHAR(200) NULL,
        [Location] NVARCHAR(200) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_Coils_Date ON dbo.Coils ([Date] DESC);
    CREATE INDEX IX_Coils_Thickness ON dbo.Coils (Thickness);
    CREATE INDEX IX_Coils_Status ON dbo.Coils ([Status]);
END;
GO

IF OBJECT_ID('dbo.Skelps', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Skelps (
        Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        SkelpNo         NVARCHAR(200)  NOT NULL,
        SlitFormNo      NVARCHAR(100)  NULL,
        [Date]          DATETIME2      NOT NULL DEFAULT GETDATE(),
        ProdFormNo      NVARCHAR(100)  NULL,
        HSPrime         NVARCHAR(100)  NULL,
        Thickness       FLOAT          NOT NULL DEFAULT 0,
        Width           FLOAT          NOT NULL DEFAULT 0,
        [Weight]        FLOAT          NOT NULL DEFAULT 0,
        WeightBefProc   FLOAT          NOT NULL DEFAULT 0,
        FGtoProduce     NVARCHAR(200)  NULL,
        LengthofFg      FLOAT          NOT NULL DEFAULT 0,
        Remarks         NVARCHAR(1000) NULL,
        [Status]        NVARCHAR(100)  NOT NULL DEFAULT 'Unprocessed',
        DateProcessed   DATETIME2      NULL,
        Operator        NVARCHAR(200)  NULL,
        OtherRemarks    NVARCHAR(200)  NULL,
        [Location]      NVARCHAR(200)  NULL,
        CreatedAt       DATETIME2      NOT NULL DEFAULT GETDATE(),
        UpdatedAt       DATETIME2      NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_Skelps_Date ON dbo.Skelps ([Date] DESC);
    CREATE INDEX IX_Skelps_Thickness ON dbo.Skelps (Thickness);
    CREATE INDEX IX_Skelps_Status ON dbo.Skelps ([Status]);
END;
GO
