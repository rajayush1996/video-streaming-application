// cookies.util.js

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';


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
 * Set a secure HTTP-only refresh token cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT refresh token
 */
const setRefreshTokenCookie = (res, token) => {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: true, // use true in production with HTTPS
        sameSite: 'None', // required for cross-domain
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
 * Clear the refresh token cookie (logout)
 * @param {Object} res - Express response object
 */
const clearRefreshTokenCookie = (res) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
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
