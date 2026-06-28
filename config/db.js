require("dotenv").config();
const sql = require("mssql");

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

let pool;

const connectToSqlServer = async () => {
    try {
        pool = await sql.connect(config);
        console.log("Connected to SQL Server");
        return pool;
    } catch (error) {
        console.error("SQL Server connection error:", error.message);
        process.exit(1);
    }
};

const getPool = () => {
    if (!pool) throw new Error("Database not connected. Call connectToSqlServer first.");
    return pool;
};

module.exports = { connectToSqlServer, getPool, sql };
