const { getPool, sql } = require("../config/db");

const ensureSchema = async () => {
    const pool = getPool();
    await pool.request().query(`
        IF COL_LENGTH('Users', 'EmployeeId') IS NULL ALTER TABLE Users ADD EmployeeId INT NULL;
        IF COL_LENGTH('Users', 'MustChangePassword') IS NULL ALTER TABLE Users ADD MustChangePassword BIT NOT NULL CONSTRAINT DF_Users_MustChangePassword DEFAULT 0;
        IF COL_LENGTH('Users', 'IsActive') IS NULL ALTER TABLE Users ADD IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1;
        IF COL_LENGTH('Users', 'IsSystemAccount') IS NULL ALTER TABLE Users ADD IsSystemAccount BIT NOT NULL CONSTRAINT DF_Users_IsSystemAccount DEFAULT 0;
        IF COL_LENGTH('Users', 'PasswordChangedAt') IS NULL ALTER TABLE Users ADD PasswordChangedAt DATETIME2 NULL;
        IF COL_LENGTH('Users', 'PasswordResetAt') IS NULL ALTER TABLE Users ADD PasswordResetAt DATETIME2 NULL;
        IF COL_LENGTH('Users', 'LastLoginAt') IS NULL ALTER TABLE Users ADD LastLoginAt DATETIME2 NULL;
        IF COL_LENGTH('Users', 'FailedLoginAttempts') IS NULL ALTER TABLE Users ADD FailedLoginAttempts INT NOT NULL CONSTRAINT DF_Users_FailedLoginAttempts DEFAULT 0;
        IF COL_LENGTH('Users', 'LockedUntil') IS NULL ALTER TABLE Users ADD LockedUntil DATETIME2 NULL;
        IF COL_LENGTH('Users', 'TokenVersion') IS NULL ALTER TABLE Users ADD TokenVersion INT NOT NULL CONSTRAINT DF_Users_TokenVersion DEFAULT 0;
        IF COL_LENGTH('Users', 'UpdatedAt') IS NULL ALTER TABLE Users ADD UpdatedAt DATETIME2 NULL;

        UPDATE Users SET IsSystemAccount = 1, EmployeeId = NULL, MustChangePassword = 0
        WHERE LOWER(UserName) = 'superadmin';

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Users') AND name = 'UX_Users_EmployeeId')
            CREATE UNIQUE INDEX UX_Users_EmployeeId ON Users(EmployeeId) WHERE EmployeeId IS NOT NULL;
    `);
};

const joinedSelect = `
    SELECT u.*, e.EmployeeNo, e.Image AS EmployeeImage, e.IsDeleted AS EmployeeIsDeleted,
           d.Department
    FROM Users u
    LEFT JOIN Employees e ON e.Id = u.EmployeeId
    LEFT JOIN Departments d ON d.Id = e.DepartmentId`;

const findByUsername = async (username) => {
    const result = await getPool().request()
        .input("UserName", sql.NVarChar, username)
        .query(`${joinedSelect} WHERE LOWER(u.UserName) = LOWER(@UserName)`);
    return result.recordset[0] || null;
};

const findById = async (id) => {
    const result = await getPool().request()
        .input("Id", sql.Int, id)
        .query(`${joinedSelect} WHERE u.Id = @Id`);
    return result.recordset[0] || null;
};

const findByEmployeeId = async (employeeId) => {
    const result = await getPool().request()
        .input("EmployeeId", sql.Int, employeeId)
        .query(`${joinedSelect} WHERE u.EmployeeId = @EmployeeId`);
    return result.recordset[0] || null;
};

const getAll = async () => {
    const result = await getPool().request().query(`${joinedSelect} ORDER BY u.IsSystemAccount DESC, u.UserName`);
    return result.recordset;
};

const getByIds = async (ids) => {
    const safeIds = ids.map(Number).filter(Number.isInteger);
    if (!safeIds.length) return [];
    const result = await getPool().request()
        .query(`${joinedSelect} WHERE u.Id IN (${safeIds.join(",")}) ORDER BY u.UserName`);
    return result.recordset;
};

const getEmployee = async (employeeId) => {
    const result = await getPool().request()
        .input("EmployeeId", sql.Int, employeeId)
        .query(`SELECT e.Id, e.EmployeeNo, e.FirstName, e.MiddleName, e.LastName, e.Suffix,
                       e.Image, e.IsDeleted, d.Department
                FROM Employees e LEFT JOIN Departments d ON d.Id = e.DepartmentId
                WHERE e.Id = @EmployeeId`);
    return result.recordset[0] || null;
};

const getAvailableEmployees = async (currentUserId = null) => {
    const result = await getPool().request()
        .input("CurrentUserId", sql.Int, currentUserId)
        .query(`SELECT e.Id, e.EmployeeNo, e.FirstName, e.MiddleName, e.LastName, e.Suffix,
                       e.Image, d.Department
                FROM Employees e
                LEFT JOIN Departments d ON d.Id = e.DepartmentId
                LEFT JOIN Users u ON u.EmployeeId = e.Id
                WHERE e.IsDeleted = 0 AND (u.Id IS NULL OR u.Id = @CurrentUserId)
                ORDER BY e.LastName, e.FirstName`);
    return result.recordset;
};

const create = async ({ employeeId, userName, role, hashedPassword }) => {
    const result = await getPool().request()
        .input("EmployeeId", sql.Int, employeeId)
        .input("UserName", sql.NVarChar, userName)
        .input("Role", sql.NVarChar, role)
        .input("Password", sql.NVarChar, hashedPassword)
        .query(`INSERT INTO Users
                    (EmployeeId, UserName, Name, Role, Password, MustChangePassword, IsActive,
                     IsSystemAccount, PasswordResetAt, UpdatedAt)
                OUTPUT INSERTED.Id, INSERTED.UserName, INSERTED.Name
                SELECT e.Id, @UserName,
                       LTRIM(RTRIM(CONCAT(e.FirstName, ' ', NULLIF(e.MiddleName, ''), ' ', e.LastName, ' ', NULLIF(e.Suffix, '')))),
                       @Role, @Password, 1, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()
                FROM Employees e WHERE e.Id = @EmployeeId AND e.IsDeleted = 0`);
    return result.recordset[0] || null;
};

const update = async (id, { employeeId, userName, role }) => {
    const result = await getPool().request()
        .input("Id", sql.Int, id)
        .input("EmployeeId", sql.Int, employeeId)
        .input("UserName", sql.NVarChar, userName)
        .input("Role", sql.NVarChar, role)
        .query(`UPDATE u SET u.EmployeeId = e.Id, u.UserName = @UserName,
                    u.Name = LTRIM(RTRIM(CONCAT(e.FirstName, ' ', NULLIF(e.MiddleName, ''), ' ', e.LastName, ' ', NULLIF(e.Suffix, '')))),
                    u.Role = @Role, u.UpdatedAt = SYSUTCDATETIME()
                OUTPUT INSERTED.*
                FROM Users u INNER JOIN Employees e ON e.Id = @EmployeeId AND e.IsDeleted = 0
                WHERE u.Id = @Id AND u.IsSystemAccount = 0`);
    return result.recordset[0] || null;
};

const resetPassword = async (id, hashedPassword) => {
    const result = await getPool().request()
        .input("Id", sql.Int, id)
        .input("Password", sql.NVarChar, hashedPassword)
        .query(`UPDATE Users SET Password = @Password, MustChangePassword = 1,
                    PasswordResetAt = SYSUTCDATETIME(), FailedLoginAttempts = 0,
                    LockedUntil = NULL, TokenVersion = TokenVersion + 1, UpdatedAt = SYSUTCDATETIME()
                OUTPUT INSERTED.Id, INSERTED.UserName, INSERTED.Name
                WHERE Id = @Id AND IsSystemAccount = 0`);
    return result.recordset[0] || null;
};

const updateOwnPassword = async (id, hashedPassword) => {
    const result = await getPool().request()
        .input("Id", sql.Int, id)
        .input("Password", sql.NVarChar, hashedPassword)
        .query(`UPDATE Users SET Password = @Password, MustChangePassword = 0,
                    PasswordChangedAt = SYSUTCDATETIME(), FailedLoginAttempts = 0,
                    LockedUntil = NULL, TokenVersion = TokenVersion + 1, UpdatedAt = SYSUTCDATETIME()
                OUTPUT INSERTED.Id WHERE Id = @Id AND IsActive = 1`);
    return result.recordset[0] || null;
};

const setActive = async (id, isActive) => {
    const result = await getPool().request()
        .input("Id", sql.Int, id)
        .input("IsActive", sql.Bit, isActive)
        .query(`UPDATE Users SET IsActive = @IsActive, TokenVersion = TokenVersion + 1,
                    FailedLoginAttempts = 0, LockedUntil = NULL, UpdatedAt = SYSUTCDATETIME()
                OUTPUT INSERTED.Id, INSERTED.IsActive
                WHERE Id = @Id AND IsSystemAccount = 0`);
    return result.recordset[0] || null;
};

const recordFailedLogin = async (id) => {
    const result = await getPool().request()
        .input("Id", sql.Int, id)
        .query(`UPDATE Users SET FailedLoginAttempts = FailedLoginAttempts + 1,
                    LockedUntil = CASE WHEN FailedLoginAttempts + 1 >= 5 THEN DATEADD(MINUTE, 15, SYSUTCDATETIME()) ELSE LockedUntil END,
                    UpdatedAt = SYSUTCDATETIME()
                OUTPUT INSERTED.FailedLoginAttempts, INSERTED.LockedUntil WHERE Id = @Id`);
    return result.recordset[0] || null;
};

const recordSuccessfulLogin = async (id) => {
    await getPool().request().input("Id", sql.Int, id)
        .query(`UPDATE Users SET LastLoginAt = SYSUTCDATETIME(), FailedLoginAttempts = 0,
                    LockedUntil = NULL, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id`);
};

const getDashboard = async () => {
    const result = await getPool().request().query(`
        SELECT COUNT(*) AS TotalAccounts,
               SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS ActiveAccounts,
               SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) AS InactiveAccounts,
               SUM(CASE WHEN MustChangePassword = 1 AND IsActive = 1 THEN 1 ELSE 0 END) AS PendingPasswordChange,
               SUM(CASE WHEN LockedUntil > SYSUTCDATETIME() THEN 1 ELSE 0 END) AS LockedAccounts,
               SUM(CASE WHEN EmployeeId IS NULL AND IsSystemAccount = 0 THEN 1 ELSE 0 END) AS UnlinkedLegacyAccounts
        FROM Users;
        SELECT TOP 8 u.Id, u.UserName, u.Name, u.Role, u.LastLoginAt, u.MustChangePassword,
                     e.EmployeeNo, e.Image AS EmployeeImage
        FROM Users u LEFT JOIN Employees e ON e.Id = u.EmployeeId
        ORDER BY COALESCE(u.UpdatedAt, u.CreatedAt) DESC, u.Id DESC;
    `);
    return { summary: result.recordsets[0][0], recentAccounts: result.recordsets[1] };
};

module.exports = {
    ensureSchema, findByUsername, findById, findByEmployeeId, getAll, getByIds,
    getEmployee, getAvailableEmployees, create, update, resetPassword,
    updateOwnPassword, setActive, recordFailedLogin, recordSuccessfulLogin, getDashboard,
};
