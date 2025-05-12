// cookies.util.js

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const { authentication } = require('../../config');

const DEFAULT_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true, // ensure you're using HTTPS
    sameSite: 'None', // for cross-site cookies
};
  
/**
   * Set a secure cookie
   * @param {Object} res - Express response object
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Additional options (maxAge, etc.)
   */
const setCookie = (res, name, value, options = {}) => {
    const finalOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options };
    res.cookie(name, value, finalOptions);
};
  
/**
   * Get a cookie value from request
   * @param {Object} req - Express request object
   * @param {string} name - Cookie name
   * @returns {string|null}
   */
const getCookie = (req, name) => {
    return req.cookies?.[name] || null;
};
  
/**
   * Clear a cookie
   * @param {Object} res - Express response object
   * @param {string} name - Cookie name
   */
const clearCookie = (res, name) => {
    res.clearCookie(name, DEFAULT_COOKIE_OPTIONS);
};

/**
 * Sets the refresh token in an HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {string} token - Refresh token to set
 */
const setRefreshTokenCookie = (res, token) => {
    // Convert refresh_token_expiration (e.g., "30d") to milliseconds
    const expiresIn = authentication.refresh_token_expiration;
    let maxAge;
    
    if (expiresIn.endsWith('d')) {
        maxAge = parseInt(expiresIn) * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    } else if (expiresIn.endsWith('h')) {
        maxAge = parseInt(expiresIn) * 60 * 60 * 1000; // Convert hours to milliseconds
    } else if (expiresIn.endsWith('m')) {
        maxAge = parseInt(expiresIn) * 60 * 1000; // Convert minutes to milliseconds
    } else if (expiresIn.endsWith('s')) {
        maxAge = parseInt(expiresIn) * 1000; // Convert seconds to milliseconds
    } else {
        maxAge = 30 * 24 * 60 * 60 * 1000; // Default to 30 days if format is unknown
    }

    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge
    });
};

/**
 * Get the refresh token from cookies
 * @param {Object} req - Express request object
 * @returns {string|null}
 */
const getRefreshTokenFromCookie = (req) => {
    return req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] || null;
};

/**
 * Clears the refresh token cookie
 * @param {Object} res - Express response object
 */
const clearRefreshTokenCookie = (res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
};

module.exports = {
    setRefreshTokenCookie,
    getRefreshTokenFromCookie,
    clearRefreshTokenCookie,
    setCookie,
    getCookie,
    clearCookie,
};
