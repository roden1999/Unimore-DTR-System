-- ============================================================
--  Unimore - Tools & Consumables Inventory module schema
--  Run AFTER schema.sql (needs the Employees + Users tables).
--
--  Design notes:
--   * Employees are shared with the DTR module. This script only
--     ADDS an Image column to the existing Employees table; all
--     tools tables reference Employees(Id).
--   * The old Mongo `project` and `toolForm` collections are merged
--     into one Projects table distinguished by FormType.
--   * Mongo string ObjectId references become real INT foreign keys.
--   * Derived values (tool availability, consumable low-stock,
--     borrowed-tool counts) are computed in queries, not stored.
-- ============================================================

USE UnimoreDBR;
GO

-- ------------------------------------------------------------
-- Employees: add profile image (base64 data URL) if missing.
-- ------------------------------------------------------------
IF COL_LENGTH('Employees', 'Image') IS NULL
    ALTER TABLE Employees ADD Image NVARCHAR(MAX) NULL;
GO

-- ------------------------------------------------------------
-- Tools
-- ------------------------------------------------------------
CREATE TABLE Tools (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    SerialNo      NVARCHAR(100)  NOT NULL UNIQUE,
    Name          NVARCHAR(200)  NOT NULL,
    Brand         NVARCHAR(100)  NULL,
    Category      NVARCHAR(100)  NOT NULL,   -- 'Electric Tool', 'Manual Tool'
    DatePurchased DATE           NULL,
    Location      NVARCHAR(200)  NULL,
    Description   NVARCHAR(500)  NULL,
    Status        NVARCHAR(50)   NULL,       -- 'Good', 'For Repair', 'For Replacement'
    IsDeleted     BIT            NOT NULL DEFAULT 0,
    CreatedAt     DATETIME       DEFAULT GETDATE(),
    INDEX IX_Tools_Category (Category),
    INDEX IX_Tools_Status (Status)
);

-- ------------------------------------------------------------
-- Consumables  (Available = Quantity - Used;
--               low stock when Quantity - Used <= CriticalLevel)
-- ------------------------------------------------------------
CREATE TABLE Consumables (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(200)  NOT NULL,
    Brand         NVARCHAR(100)  NULL,
    Unit          NVARCHAR(50)   NULL,       -- Pieces, Box, Sets, Meters, ...
    DatePurchased DATE           NULL,
    Description   NVARCHAR(500)  NULL,
    Quantity      DECIMAL(18,2)  NOT NULL DEFAULT 0,
    Used          DECIMAL(18,2)  NOT NULL DEFAULT 0,
    CriticalLevel DECIMAL(18,2)  NOT NULL DEFAULT 0,
    IsDeleted     BIT            NOT NULL DEFAULT 0,
    CreatedAt     DATETIME       DEFAULT GETDATE(),
    INDEX IX_Consumables_Name (Name)
);

-- ------------------------------------------------------------
-- Machine Spare Parts
-- ------------------------------------------------------------
CREATE TABLE SpareParts (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(200)  NOT NULL,
    Quantity      INT            NOT NULL DEFAULT 0,
    Machine       NVARCHAR(100)  NOT NULL,   -- WEBDECK, FLATDECK, RIBTYPE, ...
    Description   NVARCHAR(500)  NULL,
    Remarks       NVARCHAR(500)  NULL,
    Status        NVARCHAR(50)   NOT NULL,   -- 'Available', 'Not Available'
    IsDeleted     BIT            NOT NULL DEFAULT 0,
    CreatedAt     DATETIME       DEFAULT GETDATE(),
    INDEX IX_SpareParts_Machine (Machine)
);

-- ------------------------------------------------------------
-- Projects  (merges the old `project` + `toolForm`)
--   FormType = 'Tools'       -> shown under Tool Forms
--   FormType = 'Consumables' -> shown under Consumable Forms
-- ------------------------------------------------------------
CREATE TABLE Projects (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    ProjectName   NVARCHAR(300)  NOT NULL,
    Description   NVARCHAR(500)  NULL,
    Date          DATE           NOT NULL,
    FormType      NVARCHAR(20)   NOT NULL,   -- 'Tools' | 'Consumables'
    Status        NVARCHAR(50)   NULL,       -- 'On Going', 'Finished'
    IsDeleted     BIT            NOT NULL DEFAULT 0,
    CreatedAt     DATETIME       DEFAULT GETDATE(),
    INDEX IX_Projects_FormType (FormType)
);

-- ------------------------------------------------------------
-- Records  (tool borrow / return transactions)
--   A tool is "On Hand" when it has no record with Status='Borrowed'.
-- ------------------------------------------------------------
CREATE TABLE Records (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    ToolId        INT            NOT NULL REFERENCES Tools(Id),
    EmployeeId    INT            NOT NULL REFERENCES Employees(Id),
    ProjectId     INT            NULL REFERENCES Projects(Id),
    DateBorrowed  DATETIME       NOT NULL,
    DateReturned  DATETIME       NULL,
    Status        NVARCHAR(50)   NULL,       -- 'Borrowed', 'Returned'
    ProcessedBy   NVARCHAR(200)  NULL,
    ReceivedBy    NVARCHAR(200)  NULL,
    Remarks       NVARCHAR(500)  NULL,
    CreatedAt     DATETIME       DEFAULT GETDATE(),
    INDEX IX_Records_Tool (ToolId),
    INDEX IX_Records_Employee (EmployeeId),
    INDEX IX_Records_Project (ProjectId),
    INDEX IX_Records_Status (Status)
);

-- ------------------------------------------------------------
-- Consumable Forms  (consumable issuance line items;
--   each row draws down the parent consumable's Used counter)
-- ------------------------------------------------------------
CREATE TABLE ConsumableForms (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    ConsumableId  INT            NOT NULL REFERENCES Consumables(Id),
    EmployeeId    INT            NOT NULL REFERENCES Employees(Id),
    ProjectId     INT            NOT NULL REFERENCES Projects(Id),
    DateIssued    DATETIME       NOT NULL,
    Quantity      DECIMAL(18,2)  NOT NULL,
    Status        NVARCHAR(50)   NULL,
    Remarks       NVARCHAR(500)  NULL,
    IssuedBy      NVARCHAR(200)  NULL,
    CreatedAt     DATETIME       DEFAULT GETDATE(),
    INDEX IX_ConsumableForms_Consumable (ConsumableId),
    INDEX IX_ConsumableForms_Employee (EmployeeId),
    INDEX IX_ConsumableForms_Project (ProjectId)
);

GO
