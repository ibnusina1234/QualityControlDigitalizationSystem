// middlewares/authorizeRoles.js
const authorizeRoles = (...allowedRoles) => {
      return (req, res, next) => {
        // Pastikan user sudah di-authenticate
        if (!req.user) {
          return res.status(401).json({ error: "Unauthorized. Token tidak valid atau belum login." });
        }
    
        const userRole = req.user.userrole;
    
        // Cek apakah role user ada di daftar role yang diizinkan
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ error: "Forbidden. Role Anda tidak memiliki akses." });
        }
    
        // Kalau semua aman, lanjut ke controller
        next();
      };
    };
    
    module.exports = authorizeRoles;
    