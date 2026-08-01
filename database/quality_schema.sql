/* Quality Assurance module: inspections, NCRs, corrective actions and standards. */
IF OBJECT_ID('QualityStandards', 'U') IS NULL
CREATE TABLE QualityStandards (
    Id INT IDENTITY(1,1) PRIMARY KEY, StandardCode NVARCHAR(60) NOT NULL,
    ProductName NVARCHAR(180) NOT NULL, ParameterName NVARCHAR(120) NOT NULL,
    NominalValue DECIMAL(18,4) NULL, MinimumValue DECIMAL(18,4) NULL,
    MaximumValue DECIMAL(18,4) NULL, Unit NVARCHAR(40) NULL,
    InspectionMethod NVARCHAR(300) NULL, IsActive BIT NOT NULL DEFAULT 1,
    Notes NVARCHAR(700) NULL, IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy INT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2 NULL
);

IF OBJECT_ID('QualityInspections', 'U') IS NULL
CREATE TABLE QualityInspections (
    Id INT IDENTITY(1,1) PRIMARY KEY, InspectionNo NVARCHAR(60) NOT NULL,
    InspectionType NVARCHAR(40) NOT NULL, ReferenceType NVARCHAR(80) NULL,
    ReferenceNo NVARCHAR(120) NULL, ProductName NVARCHAR(180) NOT NULL,
    SupplierOrSource NVARCHAR(180) NULL, Quantity DECIMAL(18,3) NULL,
    Unit NVARCHAR(30) NULL, InspectionDate DATE NOT NULL,
    InspectorName NVARCHAR(150) NULL, GaugeActual DECIMAL(18,4) NULL,
    WidthActual DECIMAL(18,4) NULL, ThicknessActual DECIMAL(18,4) NULL,
    WeightActual DECIMAL(18,4) NULL, Result NVARCHAR(30) NOT NULL DEFAULT 'Pending',
    Findings NVARCHAR(1000) NULL, Notes NVARCHAR(700) NULL,
    IsDeleted BIT NOT NULL DEFAULT 0, CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2 NULL
);

IF OBJECT_ID('NonConformanceReports', 'U') IS NULL
CREATE TABLE NonConformanceReports (
    Id INT IDENTITY(1,1) PRIMARY KEY, NCRNo NVARCHAR(60) NOT NULL,
    InspectionId INT NULL, ReferenceNo NVARCHAR(120) NULL,
    DefectType NVARCHAR(120) NOT NULL, Description NVARCHAR(1000) NOT NULL,
    QuantityAffected DECIMAL(18,3) NULL, Severity NVARCHAR(30) NOT NULL DEFAULT 'Minor',
    Disposition NVARCHAR(60) NULL, Owner NVARCHAR(150) NULL,
    TargetDate DATE NULL, Status NVARCHAR(30) NOT NULL DEFAULT 'Open',
    Evidence NVARCHAR(MAX) NULL, IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy INT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2 NULL
);

IF OBJECT_ID('CorrectiveActions', 'U') IS NULL
CREATE TABLE CorrectiveActions (
    Id INT IDENTITY(1,1) PRIMARY KEY, CARNo NVARCHAR(60) NOT NULL,
    NCRId INT NULL, RootCause NVARCHAR(1000) NULL, ImmediateCorrection NVARCHAR(1000) NULL,
    CorrectiveAction NVARCHAR(1000) NOT NULL, Owner NVARCHAR(150) NULL,
    DueDate DATE NULL, Status NVARCHAR(30) NOT NULL DEFAULT 'Open',
    VerificationNotes NVARCHAR(1000) NULL, VerifiedBy NVARCHAR(150) NULL,
    VerifiedAt DATE NULL, IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy INT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2 NULL
);

IF COL_LENGTH('ProductionTraceability', 'QAStatus') IS NULL
ALTER TABLE ProductionTraceability ADD QAStatus NVARCHAR(30) NOT NULL CONSTRAINT DF_ProductionTraceability_QAStatus DEFAULT 'Not Submitted';
IF COL_LENGTH('ProductionTraceability', 'QAInspectionId') IS NULL
ALTER TABLE ProductionTraceability ADD QAInspectionId INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('QualityInspections') AND name='UX_QualityInspections_No')
CREATE UNIQUE INDEX UX_QualityInspections_No ON QualityInspections(InspectionNo) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('NonConformanceReports') AND name='UX_NCR_No')
CREATE UNIQUE INDEX UX_NCR_No ON NonConformanceReports(NCRNo) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('CorrectiveActions') AND name='UX_CAR_No')
CREATE UNIQUE INDEX UX_CAR_No ON CorrectiveActions(CARNo) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('QualityStandards') AND name='IX_QualityStandards_Product')
CREATE INDEX IX_QualityStandards_Product ON QualityStandards(ProductName, IsActive);
