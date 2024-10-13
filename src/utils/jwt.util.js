
const jwt = require('jsonwebtoken');
const config = require('../../config/config');



const verifyToken = (token, secret) => jwt.verify(token, secret, { algorithms: [config.authentication.token_algortihm] });

module.exports = { verifyToken }