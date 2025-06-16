// rateLimiter.js
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 5 menit.',
  standardHeaders: true,
  legacyHeaders: false,
});

const dynamicRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.userrole === 'admin') return 1000;
      if (decoded.userrole === 'user') return 200;
      return 100;
    } catch (err) {
      return 50;
    }
  },
  keyGenerator: (req) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.id;
    } catch (err) {
      return req.ip;
    }
  },
  message: 'Terlalu banyak permintaan, coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginRateLimiter,
  dynamicRateLimiter,
};
