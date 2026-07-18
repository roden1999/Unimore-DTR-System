-- ============================================================
--  Unimore DTR System - Data migration from MongoDB export
--  Loads Departments, DepartmentSchedules and Employees.
--
--  Run ONCE against a fresh UnimoreDBR (after schema.sql).
--  Employees reference departments by Mongo _id in the export;
--  we insert departments first, capture their new INT ids, and
--  map employees to those ids.
-- ============================================================

USE UnimoreDBR;
GO

SET NOCOUNT ON;

BEGIN TRY
BEGIN TRANSACTION;

-- ------------------------------------------------------------
-- 1) Departments  (capture generated ids into variables)
-- ------------------------------------------------------------
DECLARE @Production INT, @Office INT, @Fabrication INT, @Libis INT, @Laguna INT;

INSERT INTO Departments (Department, DayNightShift, IsDeleted) VALUES (N'Production',   1, 0);
SET @Production  = SCOPE_IDENTITY();
INSERT INTO Departments (Department, DayNightShift, IsDeleted) VALUES (N'Office',       1, 0);
SET @Office      = SCOPE_IDENTITY();
INSERT INTO Departments (Department, DayNightShift, IsDeleted) VALUES (N'Fabrication',  1, 0);
SET @Fabrication = SCOPE_IDENTITY();
INSERT INTO Departments (Department, DayNightShift, IsDeleted) VALUES (N'Libis Office', 1, 1);  -- was deleted
SET @Libis       = SCOPE_IDENTITY();
INSERT INTO Departments (Department, DayNightShift, IsDeleted) VALUES (N'Laguna Office',1, 1);  -- was deleted
SET @Laguna      = SCOPE_IDENTITY();

-- ------------------------------------------------------------
-- 2) Department Schedules  (from the timePerDay JSON)
-- ------------------------------------------------------------
INSERT INTO DepartmentSchedules (DepartmentId, DayName, TimeStart, TimeEnd, SortOrder) VALUES
-- Production
(@Production, N'Monday',    N'08:00 am', N'05:00 pm', 0),
(@Production, N'Tuesday',   N'08:00 am', N'05:00 pm', 1),
(@Production, N'Wednesday', N'08:00 am', N'05:00 pm', 2),
(@Production, N'Thursday',  N'08:00 am', N'05:00 pm', 3),
(@Production, N'Friday',    N'08:00 am', N'05:00 pm', 4),
(@Production, N'Saturday',  N'06:00 am', N'03:00 pm', 5),
-- Office
(@Office, N'Monday',    N'08:00 am', N'05:00 pm', 0),
(@Office, N'Tuesday',   N'08:00 am', N'05:00 pm', 1),
(@Office, N'Wednesday', N'08:00 am', N'06:00 pm', 2),
(@Office, N'Thursday',  N'08:00 am', N'06:00 pm', 3),
(@Office, N'Friday',    N'08:00 am', N'06:00 pm', 4),
(@Office, N'Saturday',  N'08:00 am', N'12:00 pm', 5),
-- Fabrication
(@Fabrication, N'Monday',    N'08:00 am', N'05:00 pm', 0),
(@Fabrication, N'Tuesday',   N'08:00 am', N'05:00 pm', 1),
(@Fabrication, N'Wednesday', N'08:00 am', N'05:00 pm', 2),
(@Fabrication, N'Thursday',  N'08:00 am', N'05:00 pm', 3),
(@Fabrication, N'Friday',    N'08:00 am', N'05:00 pm', 4),
(@Fabrication, N'Saturday',  N'06:00 am', N'03:00 pm', 5),
-- Libis Office
(@Libis, N'Monday',    N'08:00 am', N'05:00 pm', 0),
(@Libis, N'Tuesday',   N'08:00 am', N'05:00 pm', 1),
(@Libis, N'Wednesday', N'08:00 am', N'06:00 pm', 2),
(@Libis, N'Thursday',  N'08:00 am', N'06:00 pm', 3),
(@Libis, N'Friday',    N'08:00 am', N'06:00 pm', 4),
(@Libis, N'Saturday',  N'08:00 am', N'12:00 pm', 5),
-- Laguna Office
(@Laguna, N'Monday',    N'08:00 am', N'05:00 pm', 0),
(@Laguna, N'Tuesday',   N'08:00 am', N'05:00 pm', 1),
(@Laguna, N'Wednesday', N'08:00 am', N'06:00 pm', 2),
(@Laguna, N'Thursday',  N'08:00 am', N'06:00 pm', 3),
(@Laguna, N'Friday',    N'08:00 am', N'06:00 pm', 4),
(@Laguna, N'Saturday',  N'08:00 am', N'06:00 pm', 5);

-- ------------------------------------------------------------
-- 3) Employees
--    Staged with the original Mongo department id, then mapped
--    to the new department INT ids captured above.
-- ------------------------------------------------------------
DECLARE @Emp TABLE (
    EmployeeNo   NVARCHAR(50),
    FirstName    NVARCHAR(100),
    MiddleName   NVARCHAR(100),
    LastName     NVARCHAR(100),
    Suffix       NVARCHAR(20),
    ContactNo    NVARCHAR(50),
    Gender       NVARCHAR(20),
    Address      NVARCHAR(500),
    IsDeleted    BIT,
    DeptKey      CHAR(24)
);

INSERT INTO @Emp (EmployeeNo, FirstName, MiddleName, LastName, Suffix, ContactNo, Gender, Address, IsDeleted, DeptKey) VALUES
(N'20210070', N'Ervei',           N'O.', N'Auditor',        N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210075', N'Sandy',           N'B.', N'Lipio',          N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20180045', N'Rolando',         N'I.', N'Hagonoy',        N'',    N'',           N'Male',   N'',                          0, '60dc02b8dda9fe2ec41750f2'),
(N'20180035', N'Vencio',          N'E.', N'Mañibo',         N'',    N'',           N'Male',   N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20200055', N'Marbert',         N'L.', N'Rios',           N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20180042', N'Anthony',         N'',   N'San Jose',       N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20200050', N'Rodolfo',         N'B.', N'Mate',           N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20150010', N'Rhia',            N'M.', N'Atienza',        N'',    N'',           N'Female', N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20130005', N'Noel',            N'A.', N'Medrana',        N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20170021', N'Orly',            N'T.', N'Fabella',        N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20180044', N'Jeferson',        N'V.', N'Gerobin',        N'',    N'',           N'Male',   N'',                          0, '60dc02b8dda9fe2ec41750f2'),
(N'20170022', N'Eleonor',         N'C.', N'Gomez',          N'',    N'',           N'Female', N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20150009', N'Maximo',          N'R.', N'Apostadero',     N'',    N'',           N'Male',   N'',                          0, '60dc02b8dda9fe2ec41750f2'),
(N'20200056', N'Roberto',         N'C.', N'Del Rosario',    N'',    N'',           N'Male',   N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20170033', N'Randy',           N'H.', N'Vicencio',       N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20190046', N'Conrado',         N'G.', N'Marquez Jr.',    N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210057', N'Roden',           N'M.', N'Montoya',        N'',    N'09278372107',N'Male',   N'Gasang, Mabini, Batangas',  0, '60dab2b2dda9fe2ec417509f'),
(N'20210067', N'Ariel',           N'',   N'Toreña',         N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20170019', N'Markdale',        N'L.', N'Saragoza',       N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20200053', N'Erwin John',      N'G.', N'Buenvenida',     N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210062', N'Ralph Bennedict', N'M.', N'Garcia',         N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20200051', N'Raymond',         N'B.', N'Grego',          N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20180037', N'Arnel',           N'P.', N'Guevarra Jr.',   N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20190048', N'Raymond',         N'C.', N'Estrada',        N'',    N'',           N'Male',   N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20150008', N'Francisco',       N'R.', N'Apostadero',     N'',    N'',           N'Male',   N'',                          0, '60dc02b8dda9fe2ec41750f2'),
(N'20150012', N'Ezequiel',        N'',   N'Fabrique',       N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210058', N'Jose',            N'B.', N'Bata Jr.',       N'',    N'',           N'Male',   N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20200049', N'Charlene',        N'D.', N'Estrada',        N'',    N'',           N'Female', N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20170029', N'Hilario',         N'M.', N'Apostadero',     N'',    N'',           N'Male',   N'',                          0, '60dc02b8dda9fe2ec41750f2'),
(N'20210066', N'Dale',            N'I.', N'Fortuna',        N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20180043', N'John Lester',     N'V.', N'Bravo',          N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20170032', N'Alvin',           N'L.', N'Tolentino',      N'',    N'',           N'Male',   N'',                          0, '60dc02b8dda9fe2ec41750f2'),
(N'20180039', N'Joel',            N'M.', N'Delos Santos',   N'',    N'',           N'Male',   N'',                          0, '60dc02b8dda9fe2ec41750f2'),
(N'20170025', N'Jefferson',       N'M.', N'Pagsaligan',     N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20170028', N'Richard',         N'H.', N'Anciado',        N'',    N'',           N'Male',   N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20180040', N'Kharen',          N'G.', N'Robles',         N'',    N'',           N'Female', N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20180036', N'Rolly',           N'T.', N'Macalalad',      N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20130004', N'Patrick Joseph',  N'D.', N'Jose',           N'',    N'',           N'Male',   N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20170026', N'Jerwin',          N'L.', N'Mendoza',        N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210065', N'Marcelino',       N'T.', N'Esposo',         N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20170031', N'Marianne',        N'S.', N'Ambita',         N'',    N'',           N'Female', N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20170034', N'Argel',           N'B.', N'Alcantara',      N'III', N'9437562174', N'Male',   N'Sto. Tomas Batangas',       0, '60dc0293dda9fe2ec41750f1'),
(N'20210060', N'Jomari',          N'P.', N'Sufrayo',        N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20130006', N'Rico',            N'R.', N'Samudio',        N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20170023', N'Ronnie',          N'S.', N'Samortin',       N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210069', N'Randy',           N'F.', N'Baun',           N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20170024', N'John Roger',      N'M.', N'Rausa',          N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210073', N'Jayson',          N'L.', N'Barnedo',        N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210064', N'Delise',          N'A.', N'Magdasoc',       N'',    N'',           N'Female', N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20150011', N'Ian Arvee',       N'M.', N'Aliparo',        N'',    N'234342342352352342344324', N'Male', N'123 Barangay Sto. Tomas', 0, '60dc02b8dda9fe2ec41750f2'),
(N'20200054', N'Rez Oliver',      N'D.', N'Bagcal',         N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210068', N'Jashtine Paul',   N'G.', N'Nora',           N'',    N'',           N'Male',   N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20210059', N'Reynaldo',        N'',   N'Estolloso',      N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20190047', N'Fernando',        N'S.', N'Halili Jr.',     N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20210074', N'Jhopet',          N'F.', N'Labonite',       N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20160015', N'Elmer',           N'L.', N'Hirang',         N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
(N'20200052', N'Samuel',          N'C.', N'Atienza',        N'',    N'',           N'Male',   N'',                          0, '60dab2b2dda9fe2ec417509f'),
(N'20210063', N'James',           N'P.', N'Nogas',          N'',    N'',           N'Male',   N'',                          0, '60dc0293dda9fe2ec41750f1'),
-- test rows from the export (kept for fidelity; delete if not needed)
(N'123',      N'Test',            N'.',  N'Data',           N'III', N'123123',     N'Male',   N'sadasdas',                  1, '60dc0293dda9fe2ec41750f1'),
(N'1231232',  N'Data',            N'.',  N'Test',           N'',    N'123',        N'Female', N'asd',                       0, '60dc02b8dda9fe2ec41750f2');

INSERT INTO Employees
    (EmployeeNo, FirstName, MiddleName, LastName, Suffix, DepartmentId, ContactNo, Gender, Address, IsDeleted)
SELECT
    e.EmployeeNo, e.FirstName, e.MiddleName, e.LastName, e.Suffix,
    CASE e.DeptKey
        WHEN '60dc0293dda9fe2ec41750f1' THEN @Production
        WHEN '60dab2b2dda9fe2ec417509f' THEN @Office
        WHEN '60dc02b8dda9fe2ec41750f2' THEN @Fabrication
    END,
    e.ContactNo, e.Gender, e.Address, e.IsDeleted
FROM @Emp e;

COMMIT TRANSACTION;

DECLARE @dCount INT, @sCount INT, @eCount INT;
SELECT @dCount = COUNT(*) FROM Departments;
SELECT @sCount = COUNT(*) FROM DepartmentSchedules;
SELECT @eCount = COUNT(*) FROM Employees;
PRINT 'Migration complete.';
PRINT 'Departments: '         + CAST(@dCount AS NVARCHAR(10));
PRINT 'DepartmentSchedules: ' + CAST(@sCount AS NVARCHAR(10));
PRINT 'Employees: '           + CAST(@eCount AS NVARCHAR(10));
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
