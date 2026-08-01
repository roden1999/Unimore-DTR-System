/* Dispatch & Delivery module. */
IF OBJECT_ID('FleetVehicles','U') IS NULL
CREATE TABLE FleetVehicles (
    Id INT IDENTITY(1,1) PRIMARY KEY, PlateNo NVARCHAR(40) NOT NULL,
    VehicleName NVARCHAR(120) NULL, VehicleType NVARCHAR(60) NULL,
    Capacity NVARCHAR(80) NULL, MakeModel NVARCHAR(150) NULL,
    RegistrationExpiry DATE NULL, Status NVARCHAR(30) NOT NULL DEFAULT 'Available',
    Notes NVARCHAR(700) NULL, IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy INT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2 NULL
);

IF OBJECT_ID('DispatchOrders','U') IS NULL
CREATE TABLE DispatchOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY, DispatchNo NVARCHAR(60) NOT NULL,
    OrderReference NVARCHAR(100) NULL, ProductionBatchNo NVARCHAR(60) NULL,
    CustomerName NVARCHAR(180) NOT NULL, ContactPerson NVARCHAR(150) NULL,
    ContactNo NVARCHAR(80) NULL, FulfillmentType NVARCHAR(40) NOT NULL,
    DeliveryAddress NVARCHAR(500) NULL, ScheduledDate DATETIME2 NULL,
    VehicleId INT NULL, DriverEmployeeId INT NULL, HelperNames NVARCHAR(300) NULL,
    DeliveryFee DECIMAL(18,2) NOT NULL DEFAULT 0, FeeStatus NVARCHAR(30) NOT NULL DEFAULT 'Unbilled',
    Status NVARCHAR(40) NOT NULL DEFAULT 'Pending', SpecialInstructions NVARCHAR(700) NULL,
    LoadingCheckedBy NVARCHAR(150) NULL, ReleasedBy NVARCHAR(150) NULL,
    ReceivedBy NVARCHAR(150) NULL, DeliveredAt DATETIME2 NULL,
    ProofOfDelivery NVARCHAR(MAX) NULL, CustomerSignature NVARCHAR(MAX) NULL,
    FailureReason NVARCHAR(700) NULL, IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy INT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2 NULL
);

IF OBJECT_ID('DispatchItems','U') IS NULL
CREATE TABLE DispatchItems (
    Id INT IDENTITY(1,1) PRIMARY KEY, DispatchOrderId INT NOT NULL,
    ItemDescription NVARCHAR(250) NOT NULL, Specification NVARCHAR(250) NULL,
    Quantity DECIMAL(18,3) NOT NULL, Unit NVARCHAR(40) NULL,
    LoadedQuantity DECIMAL(18,3) NULL, DeliveredQuantity DECIMAL(18,3) NULL,
    Notes NVARCHAR(500) NULL,
    CONSTRAINT FK_DispatchItems_Order FOREIGN KEY(DispatchOrderId) REFERENCES DispatchOrders(Id) ON DELETE CASCADE
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('FleetVehicles') AND name='UX_FleetVehicles_PlateNo')
CREATE UNIQUE INDEX UX_FleetVehicles_PlateNo ON FleetVehicles(PlateNo) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('DispatchOrders') AND name='UX_DispatchOrders_No')
CREATE UNIQUE INDEX UX_DispatchOrders_No ON DispatchOrders(DispatchNo) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('DispatchOrders') AND name='IX_DispatchOrders_Schedule')
CREATE INDEX IX_DispatchOrders_Schedule ON DispatchOrders(ScheduledDate,Status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('DispatchItems') AND name='IX_DispatchItems_Order')
CREATE INDEX IX_DispatchItems_Order ON DispatchItems(DispatchOrderId);
