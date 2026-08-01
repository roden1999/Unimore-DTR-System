/* IT Asset Management: idempotent asset-register schema. */
IF OBJECT_ID('ITAssets', 'U') IS NULL
CREATE TABLE ITAssets (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AssetTag NVARCHAR(60) NOT NULL,
    Category NVARCHAR(60) NOT NULL,
    AssetType NVARCHAR(100) NULL,
    Brand NVARCHAR(100) NULL,
    Model NVARCHAR(150) NULL,
    SerialNo NVARCHAR(150) NULL,
    HostName NVARCHAR(150) NULL,
    Specifications NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(80) NULL,
    MACAddress NVARCHAR(80) NULL,
    Location NVARCHAR(180) NULL,
    AssignedEmployeeId INT NULL,
    PurchaseDate DATE NULL,
    WarrantyExpiry DATE NULL,
    Vendor NVARCHAR(180) NULL,
    Cost DECIMAL(18,2) NULL,
    [Status] NVARCHAR(40) NOT NULL DEFAULT 'In Stock',
    [Condition] NVARCHAR(40) NOT NULL DEFAULT 'Good',
    Notes NVARCHAR(700) NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('ITAssets') AND name='UX_ITAssets_AssetTag')
CREATE UNIQUE INDEX UX_ITAssets_AssetTag ON ITAssets(AssetTag) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('ITAssets') AND name='IX_ITAssets_CategoryStatus')
CREATE INDEX IX_ITAssets_CategoryStatus ON ITAssets(Category, [Status]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('ITAssets') AND name='IX_ITAssets_AssignedEmployee')
CREATE INDEX IX_ITAssets_AssignedEmployee ON ITAssets(AssignedEmployeeId);
