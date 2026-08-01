IF OBJECT_ID('UteslaSettings','U') IS NULL
BEGIN
    CREATE TABLE UteslaSettings (
        Id INT NOT NULL PRIMARY KEY CHECK (Id = 1),
        OrganizationName NVARCHAR(150) NOT NULL DEFAULT 'UTESLA Cooperative',
        CurrencyCode NVARCHAR(10) NOT NULL DEFAULT 'PHP',
        DefaultAnnualLoanRate DECIMAL(9,4) NOT NULL DEFAULT 12,
        DefaultInterestMethod NVARCHAR(30) NOT NULL DEFAULT 'Reducing Balance',
        DefaultTermMonths INT NOT NULL DEFAULT 12,
        MaximumTermMonths INT NOT NULL DEFAULT 24,
        MaximumLoanMultiple DECIMAL(9,2) NOT NULL DEFAULT 2,
        MinimumContribution DECIMAL(18,2) NOT NULL DEFAULT 100,
        AllowSavingsWithdrawals BIT NOT NULL DEFAULT 1,
        EnforceFundAvailability BIT NOT NULL DEFAULT 1,
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedBy INT NULL
    );
    INSERT INTO UteslaSettings (Id) VALUES (1);
END;

IF OBJECT_ID('UteslaMembers','U') IS NULL
BEGIN
    CREATE TABLE UteslaMembers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MemberNo NVARCHAR(40) NOT NULL UNIQUE,
        EmployeeId INT NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
        JoinedDate DATE NOT NULL,
        MonthlyContribution DECIMAL(18,2) NOT NULL DEFAULT 0,
        Notes NVARCHAR(700) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_UteslaMembers_Employees FOREIGN KEY (EmployeeId) REFERENCES Employees(Id)
    );
    CREATE UNIQUE INDEX UX_UteslaMembers_Employee ON UteslaMembers(EmployeeId) WHERE IsDeleted = 0;
END;

IF OBJECT_ID('UteslaDividendRuns','U') IS NULL
BEGIN
    CREATE TABLE UteslaDividendRuns (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        RunNo NVARCHAR(50) NOT NULL UNIQUE,
        PeriodStart DATE NOT NULL,
        PeriodEnd DATE NOT NULL,
        PoolAmount DECIMAL(18,2) NOT NULL,
        EligibleSavings DECIMAL(18,2) NOT NULL,
        MemberCount INT NOT NULL,
        Notes NVARCHAR(700) NULL,
        PostedBy INT NULL,
        PostedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;

IF OBJECT_ID('UteslaSavingsTransactions','U') IS NULL
BEGIN
    CREATE TABLE UteslaSavingsTransactions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TransactionNo NVARCHAR(50) NOT NULL UNIQUE,
        MemberId INT NOT NULL,
        TransactionDate DATE NOT NULL,
        TransactionType NVARCHAR(30) NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        ReferenceNo NVARCHAR(100) NULL,
        Notes NVARCHAR(700) NULL,
        DividendRunId INT NULL,
        PostedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        IsVoided BIT NOT NULL DEFAULT 0,
        VoidedAt DATETIME2 NULL,
        VoidedBy INT NULL,
        VoidReason NVARCHAR(500) NULL,
        CONSTRAINT FK_UteslaSavings_Member FOREIGN KEY (MemberId) REFERENCES UteslaMembers(Id),
        CONSTRAINT FK_UteslaSavings_Dividend FOREIGN KEY (DividendRunId) REFERENCES UteslaDividendRuns(Id)
    );
    CREATE INDEX IX_UteslaSavings_MemberDate ON UteslaSavingsTransactions(MemberId, TransactionDate, Id);
END;

IF OBJECT_ID('UteslaLoans','U') IS NULL
BEGIN
    CREATE TABLE UteslaLoans (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        LoanNo NVARCHAR(50) NOT NULL UNIQUE,
        MemberId INT NOT NULL,
        ApplicationDate DATE NOT NULL,
        Principal DECIMAL(18,2) NOT NULL,
        AnnualInterestRate DECIMAL(9,4) NOT NULL,
        InterestMethod NVARCHAR(30) NOT NULL,
        TermMonths INT NOT NULL,
        Purpose NVARCHAR(500) NOT NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT 'Pending Approval',
        FirstDueDate DATE NULL,
        ApprovedBy INT NULL,
        ApprovedAt DATETIME2 NULL,
        ReleasedBy INT NULL,
        ReleasedAt DATETIME2 NULL,
        RejectionReason NVARCHAR(500) NULL,
        Notes NVARCHAR(700) NULL,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_UteslaLoans_Member FOREIGN KEY (MemberId) REFERENCES UteslaMembers(Id)
    );
    CREATE INDEX IX_UteslaLoans_MemberStatus ON UteslaLoans(MemberId, Status);
END;

IF OBJECT_ID('UteslaLoanSchedules','U') IS NULL
BEGIN
    CREATE TABLE UteslaLoanSchedules (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        LoanId INT NOT NULL,
        InstallmentNo INT NOT NULL,
        DueDate DATE NOT NULL,
        BeginningBalance DECIMAL(18,2) NOT NULL,
        PrincipalDue DECIMAL(18,2) NOT NULL,
        InterestDue DECIMAL(18,2) NOT NULL,
        TotalDue DECIMAL(18,2) NOT NULL,
        PrincipalPaid DECIMAL(18,2) NOT NULL DEFAULT 0,
        InterestPaid DECIMAL(18,2) NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Unpaid',
        CONSTRAINT FK_UteslaSchedule_Loan FOREIGN KEY (LoanId) REFERENCES UteslaLoans(Id),
        CONSTRAINT UX_UteslaSchedule_Installment UNIQUE (LoanId, InstallmentNo)
    );
END;

IF OBJECT_ID('UteslaLoanPayments','U') IS NULL
BEGIN
    CREATE TABLE UteslaLoanPayments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PaymentNo NVARCHAR(50) NOT NULL UNIQUE,
        LoanId INT NOT NULL,
        PaymentDate DATE NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        PrincipalApplied DECIMAL(18,2) NOT NULL,
        InterestApplied DECIMAL(18,2) NOT NULL,
        ExcessAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        PaymentMethod NVARCHAR(40) NOT NULL,
        ReferenceNo NVARCHAR(100) NULL,
        Notes NVARCHAR(700) NULL,
        PostedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        IsVoided BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_UteslaPayments_Loan FOREIGN KEY (LoanId) REFERENCES UteslaLoans(Id)
    );
    CREATE INDEX IX_UteslaPayments_LoanDate ON UteslaLoanPayments(LoanId, PaymentDate, Id);
END;

IF OBJECT_ID('UteslaDividendAllocations','U') IS NULL
BEGIN
    CREATE TABLE UteslaDividendAllocations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DividendRunId INT NOT NULL,
        MemberId INT NOT NULL,
        SavingsBalance DECIMAL(18,2) NOT NULL,
        AllocatedAmount DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_UteslaAllocation_Run FOREIGN KEY (DividendRunId) REFERENCES UteslaDividendRuns(Id),
        CONSTRAINT FK_UteslaAllocation_Member FOREIGN KEY (MemberId) REFERENCES UteslaMembers(Id),
        CONSTRAINT UX_UteslaAllocation_Member UNIQUE (DividendRunId, MemberId)
    );
END;
