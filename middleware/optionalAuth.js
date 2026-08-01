const { jwtVerify } = require('jose');
const getSecretKey = () => new TextEncoder().encode(process.env.SECRET_TOKEN);

module.exports = async (req, _res, next) => {
    const token = req.header('auth-token');
    if (token) {
        try { req.user = (await jwtVerify(token, getSecretKey())).payload; }
        catch (_error) { /* Protected routes still reject invalid tokens themselves. */ }
    }
    next();
};
