const verifyToken = (req, res, next) => {
  console.log("=== VERIFY TOKEN START ===");
  
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  console.log("Token found:", !!token);

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified successfully");
    console.log("Decoded token:", decoded);
    
    // Set req.user directly from decoded token
    req.user = decoded;
    console.log("req.user set to:", req.user);
    
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};