const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME || '15m' }); // Short-lived token
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME || '7d' }); // Long-lived token
};

module.exports = { 
  generateAccessToken, 
  generateRefreshToken 
};
