
const jwt = require('jsonwebtoken');
const config = require('../../config');
const crypto = require('crypto');



const verifyToken = (token, secret) => jwt.verify(token, secret, { algorithms: [config.authentication.token_algortihm] });

const algorithm = config.authentication.encryption_aglorithm;
const encryptionKey = config.authentication.encryption_secret

const key = crypto.scryptSync( encryptionKey, 'encryption', 32)
// Encrypts a given text
const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, "utf-8"), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
};

// Decrypts an encrypted text
const decrypt = (text) => {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, "utf-8"), iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};

module.exports = { verifyToken, encrypt, decrypt }