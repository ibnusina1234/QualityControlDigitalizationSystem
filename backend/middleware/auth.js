const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token; // pakai optional chaining (?.) biar aman

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded Token:", decoded);
    req.user = decoded; 
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
