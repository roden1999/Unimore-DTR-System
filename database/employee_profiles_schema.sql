USE UnimoreDBR;
GO

IF COL_LENGTH('Employees', 'Image') IS NULL
    ALTER TABLE Employees ADD Image NVARCHAR(MAX) NULL;
GO

IF COL_LENGTH('Employees', 'BirthDate') IS NULL
    ALTER TABLE Employees ADD BirthDate DATE NULL;
GO
