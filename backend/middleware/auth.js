const verifyToken = (req, res, next) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Token sudah berisi semua data yang diperlukan
    req.user = decoded;
    
    console.log("✅ req.user set:", req.user);
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};