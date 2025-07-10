// rateLimiter.js
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 5 menit
  max: 6,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      error: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 jam
  max: 6, // Maks 5 permintaan per jam per IP/email
  message:
    'Terlalu banyak permintaan reset password. Silakan coba lagi setelah 15 menit.',
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
   resetPasswordLimiter ,
};
