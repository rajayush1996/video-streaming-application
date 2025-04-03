const { verifyToken } = require('../utils/security.util');
const config = require('../../config');
// const fs = require('fs');
// const configStore = require('../../config/configStore');
// const logger = require('../features/logger');

// const privateKeyPath = config.authentication.private_key_path;

// const secretKey = fs.readFileSync(`${privateKeyPath}`, 'utf8') || config.authentication.jwt_token_secret_key;

const authenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const tokenSecret = config.authentication.jwt_token_secret_key;
        const decoded = verifyToken(token, tokenSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token', error });
    }
};

module.exports = authenticated;
