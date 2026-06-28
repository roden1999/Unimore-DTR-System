require("dotenv").config();

module.exports = {
    PORT: process.env.PORT,
    SECRET_TOKEN: process.env.SECRET_TOKEN,
    DB_SERVER: process.env.DB_SERVER,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_PORT: process.env.DB_PORT || 1433,
    DB_ENCRYPT: process.env.DB_ENCRYPT,
    DB_TRUST_CERT: process.env.DB_TRUST_CERT,
};
