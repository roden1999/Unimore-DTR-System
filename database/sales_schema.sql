/* Sales & Job Order Management. Stable stage keys keep the workflow customizable. */
IF OBJECT_ID('dbo.SalesDocumentSequence','SO') IS NULL
    EXEC('CREATE SEQUENCE dbo.SalesDocumentSequence AS BIGINT START WITH 1 INCREMENT BY 1');

IF OBJECT_ID('SalesSettings','U') IS NULL
CREATE TABLE SalesSettings (
    SettingKey NVARCHAR(80) NOT NULL PRIMARY KEY,
    SettingValue NVARCHAR(MAX) NULL,
    Description NVARCHAR(300) NULL,
    UpdatedAt DATETIME2 NULL,
    UpdatedBy INT NULL
);

IF OBJECT_ID('SalesWorkflowStages','U') IS NULL
CREATE TABLE SalesWorkflowStages (
    StageKey NVARCHAR(40) NOT NULL PRIMARY KEY,
    StageLabel NVARCHAR(100) NOT NULL,
    SortOrder INT NOT NULL,
    ResponsibleModule NVARCHAR(40) NOT NULL,
    Color NVARCHAR(20) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

IF OBJECT_ID('SalesCustomers','U') IS NULL
CREATE TABLE SalesCustomers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerCode NVARCHAR(40) NOT NULL,
    CustomerName NVARCHAR(180) NOT NULL,
    CustomerType NVARCHAR(40) NULL,
    ContactPerson NVARCHAR(150) NULL,
    ContactNo NVARCHAR(80) NULL,
    Email NVARCHAR(180) NULL,
    BillingAddress NVARCHAR(500) NULL,
    DeliveryAddress NVARCHAR(500) NULL,
    TaxIdentificationNo NVARCHAR(80) NULL,
    CreditTerms NVARCHAR(80) NULL,
    Notes NVARCHAR(700) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

IF OBJECT_ID('SalesProducts','U') IS NULL
CREATE TABLE SalesProducts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode NVARCHAR(50) NOT NULL,
    ProductName NVARCHAR(180) NOT NULL,
    Category NVARCHAR(80) NOT NULL,
    Description NVARCHAR(500) NULL,
    PricingUnit NVARCHAR(40) NOT NULL,
    BasePrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    IsMadeToOrder BIT NOT NULL DEFAULT 1,
    SpecificationFields NVARCHAR(500) NULL,
    Notes NVARCHAR(700) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

IF OBJECT_ID('SalesInquiries','U') IS NULL
CREATE TABLE SalesInquiries (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    InquiryNo NVARCHAR(60) NOT NULL,
    CustomerId INT NOT NULL,
    InquiryDate DATE NOT NULL,
    ValidUntil DATE NULL,
    FulfillmentType NVARCHAR(40) NOT NULL DEFAULT 'Customer Pickup',
    DeliveryAddress NVARCHAR(500) NULL,
    TaxMode NVARCHAR(30) NOT NULL DEFAULT 'VAT Exclusive',
    TaxRate DECIMAL(8,3) NOT NULL DEFAULT 12,
    SubTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    TaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    GrandTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    Status NVARCHAR(30) NOT NULL DEFAULT 'Open',
    Notes NVARCHAR(1000) NULL,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_SalesInquiries_Customer FOREIGN KEY(CustomerId) REFERENCES SalesCustomers(Id)
);

IF OBJECT_ID('SalesInquiryItems','U') IS NULL
CREATE TABLE SalesInquiryItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    InquiryId INT NOT NULL,
    ProductId INT NULL,
    ItemDescription NVARCHAR(250) NOT NULL,
    Specification NVARCHAR(1000) NULL,
    Quantity DECIMAL(18,3) NOT NULL,
    Unit NVARCHAR(40) NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    DiscountPercent DECIMAL(8,3) NOT NULL DEFAULT 0,
    LineTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    IsMadeToOrder BIT NOT NULL DEFAULT 1,
    Notes NVARCHAR(500) NULL,
    CONSTRAINT FK_SalesInquiryItems_Inquiry FOREIGN KEY(InquiryId) REFERENCES SalesInquiries(Id) ON DELETE CASCADE,
    CONSTRAINT FK_SalesInquiryItems_Product FOREIGN KEY(ProductId) REFERENCES SalesProducts(Id)
);

IF OBJECT_ID('SalesOrders','U') IS NULL
CREATE TABLE SalesOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    JobOrderNo NVARCHAR(60) NOT NULL,
    InquiryId INT NULL,
    CustomerId INT NOT NULL,
    CustomerReference NVARCHAR(100) NULL,
    OrderDate DATE NOT NULL,
    RequiredDate DATE NULL,
    FulfillmentType NVARCHAR(40) NOT NULL DEFAULT 'Customer Pickup',
    DeliveryAddress NVARCHAR(500) NULL,
    WorkflowStage NVARCHAR(40) NOT NULL DEFAULT 'PRODUCTION_QUEUE',
    ProductionBatchNo NVARCHAR(60) NULL,
    DispatchOrderId INT NULL,
    TaxMode NVARCHAR(30) NOT NULL DEFAULT 'VAT Exclusive',
    TaxRate DECIMAL(8,3) NOT NULL DEFAULT 12,
    SubTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    TaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    GrandTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    PaymentStatus NVARCHAR(30) NOT NULL DEFAULT 'Unbilled',
    AmountPaid DECIMAL(18,2) NOT NULL DEFAULT 0,
    Notes NVARCHAR(1000) NULL,
    SpecialInstructions NVARCHAR(1000) NULL,
    ProductionStartedAt DATETIME2 NULL,
    ProductionCompletedAt DATETIME2 NULL,
    ReadyAt DATETIME2 NULL,
    CompletedAt DATETIME2 NULL,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_SalesOrders_Inquiry FOREIGN KEY(InquiryId) REFERENCES SalesInquiries(Id),
    CONSTRAINT FK_SalesOrders_Customer FOREIGN KEY(CustomerId) REFERENCES SalesCustomers(Id)
);

IF OBJECT_ID('SalesOrderItems','U') IS NULL
CREATE TABLE SalesOrderItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SalesOrderId INT NOT NULL,
    ProductId INT NULL,
    ItemDescription NVARCHAR(250) NOT NULL,
    Specification NVARCHAR(1000) NULL,
    Quantity DECIMAL(18,3) NOT NULL,
    Unit NVARCHAR(40) NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    DiscountPercent DECIMAL(8,3) NOT NULL DEFAULT 0,
    LineTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    IsMadeToOrder BIT NOT NULL DEFAULT 1,
    Notes NVARCHAR(500) NULL,
    CONSTRAINT FK_SalesOrderItems_Order FOREIGN KEY(SalesOrderId) REFERENCES SalesOrders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_SalesOrderItems_Product FOREIGN KEY(ProductId) REFERENCES SalesProducts(Id)
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('SalesCustomers') AND name='UX_SalesCustomers_Code')
CREATE UNIQUE INDEX UX_SalesCustomers_Code ON SalesCustomers(CustomerCode) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('SalesProducts') AND name='UX_SalesProducts_Code')
CREATE UNIQUE INDEX UX_SalesProducts_Code ON SalesProducts(ProductCode) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('SalesInquiries') AND name='UX_SalesInquiries_No')
CREATE UNIQUE INDEX UX_SalesInquiries_No ON SalesInquiries(InquiryNo) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('SalesOrders') AND name='UX_SalesOrders_No')
CREATE UNIQUE INDEX UX_SalesOrders_No ON SalesOrders(JobOrderNo) WHERE IsDeleted=0;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('SalesOrders') AND name='IX_SalesOrders_Stage')
CREATE INDEX IX_SalesOrders_Stage ON SalesOrders(WorkflowStage,RequiredDate);

IF NOT EXISTS (SELECT 1 FROM SalesSettings WHERE SettingKey='CurrencySymbol') INSERT SalesSettings VALUES('CurrencySymbol',N'₱','Symbol used on sales documents',NULL,NULL);
IF NOT EXISTS (SELECT 1 FROM SalesSettings WHERE SettingKey='DefaultTaxMode') INSERT SalesSettings VALUES('DefaultTaxMode','VAT Exclusive','VAT Exclusive, VAT Inclusive, or Non-VAT',NULL,NULL);
IF NOT EXISTS (SELECT 1 FROM SalesSettings WHERE SettingKey='DefaultTaxRate') INSERT SalesSettings VALUES('DefaultTaxRate','12','Default percentage; editable per transaction',NULL,NULL);
IF NOT EXISTS (SELECT 1 FROM SalesSettings WHERE SettingKey='RequireQARelease') INSERT SalesSettings VALUES('RequireQARelease','false','Require a QA-released batch before dispatch',NULL,NULL);
IF NOT EXISTS (SELECT 1 FROM SalesSettings WHERE SettingKey='AllowStockFulfillment') INSERT SalesSettings VALUES('AllowStockFulfillment','true','Allow an order item to be fulfilled from finished stock',NULL,NULL);

IF NOT EXISTS (SELECT 1 FROM SalesWorkflowStages WHERE StageKey='PRODUCTION_QUEUE') INSERT SalesWorkflowStages VALUES('PRODUCTION_QUEUE','Queued for Production',10,'Production','#F59E0B',1);
IF NOT EXISTS (SELECT 1 FROM SalesWorkflowStages WHERE StageKey='IN_PRODUCTION') INSERT SalesWorkflowStages VALUES('IN_PRODUCTION','In Production',20,'Production','#2563EB',1);
IF NOT EXISTS (SELECT 1 FROM SalesWorkflowStages WHERE StageKey='FOR_QA') INSERT SalesWorkflowStages VALUES('FOR_QA','For Quality Inspection',30,'Quality Assurance','#8B5CF6',1);
IF NOT EXISTS (SELECT 1 FROM SalesWorkflowStages WHERE StageKey='READY_DISPATCH') INSERT SalesWorkflowStages VALUES('READY_DISPATCH','Ready for Pickup / Delivery',40,'Dispatch','#10B981',1);
IF NOT EXISTS (SELECT 1 FROM SalesWorkflowStages WHERE StageKey='DISPATCH') INSERT SalesWorkflowStages VALUES('DISPATCH','Pickup / Delivery in Progress',50,'Dispatch','#F97316',1);
IF NOT EXISTS (SELECT 1 FROM SalesWorkflowStages WHERE StageKey='COMPLETED') INSERT SalesWorkflowStages VALUES('COMPLETED','Completed',60,'Sales','#059669',1);
IF NOT EXISTS (SELECT 1 FROM SalesWorkflowStages WHERE StageKey='CANCELLED') INSERT SalesWorkflowStages VALUES('CANCELLED','Cancelled',90,'Sales','#DC2626',1);

/* Keep the job order synchronized when Dispatch finishes a pickup or delivery. */
EXEC(N'CREATE OR ALTER TRIGGER dbo.TR_DispatchOrders_CompleteSalesOrder ON dbo.DispatchOrders AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE salesOrder
       SET WorkflowStage=''COMPLETED'',CompletedAt=COALESCE(salesOrder.CompletedAt,SYSUTCDATETIME()),UpdatedAt=SYSUTCDATETIME()
      FROM dbo.SalesOrders salesOrder
      INNER JOIN inserted dispatchOrder ON dispatchOrder.OrderReference=salesOrder.JobOrderNo
     WHERE dispatchOrder.Status IN (''Delivered'',''Released'') AND salesOrder.IsDeleted=0;
END');
