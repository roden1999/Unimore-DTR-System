-- ============================================================
--  Unimore DTR System - SQL Server Database Schema
-- ============================================================

CREATE DATABASE UnimoreDBR;
GO

USE UnimoreDBR;
GO

-- ============================================================
--  Users
-- ============================================================
CREATE TABLE Users (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    UserName    NVARCHAR(100)  NOT NULL UNIQUE,
    Name        NVARCHAR(200)  NOT NULL,
    Role        NVARCHAR(50)   NOT NULL,
    Password    NVARCHAR(255)  NOT NULL,
    CreatedAt   DATETIME       DEFAULT GETDATE()
);

-- ============================================================
--  Departments
-- ============================================================
CREATE TABLE Departments (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Department    NVARCHAR(200)  NOT NULL UNIQUE,
    DayNightShift BIT            NOT NULL DEFAULT 0,
    IsDeleted     BIT            NOT NULL DEFAULT 0,
    CreatedAt     DATETIME       DEFAULT GETDATE()
);

-- ============================================================
--  Department Schedules  (replaces the JSON timePerDay string)
-- ============================================================
CREATE TABLE DepartmentSchedules (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentId  INT           NOT NULL REFERENCES Departments(Id) ON DELETE CASCADE,
    DayName       NVARCHAR(20)  NOT NULL,   -- Monday … Saturday
    TimeStart     NVARCHAR(10)  NOT NULL,   -- e.g. "8:00"
    TimeEnd       NVARCHAR(10)  NOT NULL,   -- e.g. "17:00"
    SortOrder     INT           NOT NULL DEFAULT 0
);

-- ============================================================
--  Employees
-- ============================================================
CREATE TABLE Employees (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeNo    NVARCHAR(50)   NOT NULL UNIQUE,
    FirstName     NVARCHAR(100)  NOT NULL,
    MiddleName    NVARCHAR(100)  NOT NULL DEFAULT '',
    LastName      NVARCHAR(100)  NOT NULL,
    Suffix        NVARCHAR(20)   NOT NULL DEFAULT '',
    DepartmentId  INT            NOT NULL REFERENCES Departments(Id),
    ContactNo     NVARCHAR(50)   NOT NULL DEFAULT '',
    Gender        NVARCHAR(20)   NOT NULL DEFAULT '',
    Address       NVARCHAR(500)  NOT NULL DEFAULT '',
    IsDeleted     BIT            NOT NULL DEFAULT 0,
    CreatedAt     DATETIME       DEFAULT GETDATE()
);

-- ============================================================
--  Time Logs  (raw punch records)
-- ============================================================
CREATE TABLE TimeLogs (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeNo    NVARCHAR(50)   NOT NULL,
    EmployeeName  NVARCHAR(300)  NOT NULL DEFAULT '',
    TimeInOut     NVARCHAR(5)    NOT NULL,   -- 'S' = Start/In, 'E' = End/Out
    DateTime      DATETIME       NOT NULL,
    CreatedAt     DATETIME       DEFAULT GETDATE(),
    INDEX IX_TimeLogs_EmpNo_DateTime (EmployeeNo, DateTime)
);

-- ============================================================
--  DTR Corrections  (manual overrides)
-- ============================================================
CREATE TABLE DtrCorrections (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeNo      NVARCHAR(50)   NOT NULL,
    EmployeeName    NVARCHAR(300)  NOT NULL,
    Date            DATETIME       NOT NULL,
    TimeIn          NVARCHAR(20)   NULL,
    TimeOut         NVARCHAR(20)   NULL,
    OtHours         DECIMAL(8,2)   NOT NULL DEFAULT 0,
    BreakTime       BIT            NOT NULL DEFAULT 0,
    BreakTimeHrs    DECIMAL(8,2)   NOT NULL DEFAULT 0,
    HoursWork       DECIMAL(8,2)   NOT NULL DEFAULT 0,
    Undertime       DECIMAL(8,2)   NOT NULL DEFAULT 0,
    Remarks         NVARCHAR(100)  NULL,
    Reason          NVARCHAR(500)  NULL,
    DateApproved    DATETIME       NOT NULL,
    CreatedAt       DATETIME       DEFAULT GETDATE(),
    INDEX IX_DtrCorrections_EmpNo_Date (EmployeeNo, Date)
);

-- ============================================================
--  Salaries & Deductions
-- ============================================================
CREATE TABLE Salaries (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId      INT            NOT NULL UNIQUE REFERENCES Employees(Id) ON DELETE CASCADE,
    Salary          DECIMAL(18,2)  NOT NULL DEFAULT 0,
    Sss             DECIMAL(18,2)  NOT NULL DEFAULT 0,
    Phic            DECIMAL(18,2)  NOT NULL DEFAULT 0,
    Hdmf            DECIMAL(18,2)  NOT NULL DEFAULT 0,
    SssLoan         DECIMAL(18,2)  NOT NULL DEFAULT 0,
    PagibigLoan     DECIMAL(18,2)  NOT NULL DEFAULT 0,
    CareHealthPlus  DECIMAL(18,2)  NOT NULL DEFAULT 0,
    CashAdvance     DECIMAL(18,2)  NOT NULL DEFAULT 0,
    SafetyShoes     DECIMAL(18,2)  NOT NULL DEFAULT 0,
    UpdatedAt       DATETIME       DEFAULT GETDATE()
);

-- ============================================================
--  Holiday Schedules
-- ============================================================
CREATE TABLE HolidaySchedules (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Date        DATETIME       NOT NULL,
    Title       NVARCHAR(300)  NOT NULL,
    Type        NVARCHAR(100)  NOT NULL,   -- 'Regular Holiday', 'Special Holiday', etc.
    IsDeleted   BIT            NOT NULL DEFAULT 0,
    CreatedAt   DATETIME       DEFAULT GETDATE(),
    INDEX IX_HolidaySchedules_Date (Date)
);

GO
