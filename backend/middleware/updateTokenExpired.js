const jwt = require("jsonwebtoken");

const updateTokenExpiry = (req, res, next) => {
  const token = req.cookies?.token; // Ambil token dari cookies

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Menyimpan decoded token pada req.user

    // Membuat token baru dengan masa kadaluwarsa yang lebih panjang
    const newToken = jwt.sign(decoded, process.env.JWT_SECRET, {
    });

    // Set ulang token di cookie dengan waktu kedaluwarsa yang baru
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: false, // Set true jika menggunakan HTTPS
      sameSite: "Strict", 
      maxAge: 3600000, // 1 jam
    });

    next(); // Lanjutkan request ke handler selanjutnya
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = updateTokenExpiry;
