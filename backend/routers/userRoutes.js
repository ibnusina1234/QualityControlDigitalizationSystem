const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const userController = require("../controllers/userControllers");
const db = require("../database/db");
const verifyToken = require("../middleware/auth");
const logActivity = require("../helpers/logger");
const logController = require("../controllers/logController");
const monitoringData = require("../controllers/monitoringRuangan");
const validatePassword = require("../middleware/validatePassword");
const { body } = require("express-validator");
const authorizeRoles = require("../middleware/authorizeRoles");
const updateTokenExpiry = require("../middleware/updateTokenExpired");
const { sendStatusEmail } = require("../utils/sendEmailToUser");
const {
  dynamicRateLimiter,
  loginRateLimiter,
   resetPasswordLimiter ,
} = require("../middleware/rateLimit");
const validate = require("../middleware/userValidation");
const sanitizeInput = require("../middleware/validateInput");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updateUserStatusSchema,
} = require("../Validations/userValidations");

// Valid extensions
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const { itemId, itemType } = req.body;
    const ext = path.extname(file.originalname).toLowerCase();

    const safeName =
      itemType && itemId
        ? `${itemType}_${itemId}${ext}`
        : `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, safeName.replace(/[^a-z0-9_.-]/gi, "_")); // sanitasi nama file
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (ALLOWED_EXTENSIONS.test(ext) && ALLOWED_MIME_TYPES.includes(mime)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Hanya file gambar dengan format jpg, jpeg, png, webp yang diperbolehkan."
      )
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maks 10MB
  fileFilter,
});

// 📌 ROUTES
// 🔹 Upload file
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// 🔹 Check email routes
router.post("/check-email", userController.checkEmail);

// 🔹 Registrasi pengguna baru
router.post(
  "/Register",
  dynamicRateLimiter,
  upload.single("img"),
  validate(registerSchema),
  sanitizeInput,
  userController.registerUser
);

// 🔹 Login pengguna
router.post(
  "/Login",
  loginRateLimiter,
  [
    body("email").isEmail().withMessage("Email tidak valid"),
    body("password").notEmpty().withMessage("Password wajib diisi"),
    validatePassword,
    validate(loginSchema),
    sanitizeInput,
  ],
  userController.loginUser
);

// 🔹 Logout pengguna
router.post(
  "/logout",
  dynamicRateLimiter,
  verifyToken,
  updateTokenExpiry,
  userController.logoutUser
);

// 🔹 send email to alert
router.post("/alert", userController.sendTemperatureAlert);

//🔹 update token
router.post(
  "/users/updateToken",
  verifyToken,
  updateTokenExpiry,
  (req, res) => {
    res.json({ message: "Token expiry updated successfully" });
  }
);

// 🔹 Verifikasi token (dipanggil saat refresh)
router.get("/verify-token", verifyToken, updateTokenExpiry, (req, res) => {
  res.json({ message: "Token valid", user: req.user });
});

// 🔹 Mendapatkan profil pengguna
router.get(
  "/Profile",
  verifyToken,
  updateTokenExpiry,
  userController.getProfile
);

// 🔹 Memperbarui profil pengguna
router.put(
  "/profile",
  dynamicRateLimiter,
  verifyToken,
  updateTokenExpiry,
  upload.single("img"),
  userController.updateProfile
);

router.put(
  "/userrole/:id",
  dynamicRateLimiter,
  verifyToken,
  userController.updateUserRole
);

// 🔹 Permintaan reset password
router.post(
  "/request-password-reset",
   resetPasswordLimiter,sanitizeInput,
  userController.requestPasswordReset
);

// 🔹 Reset password
router.post(
  "/reset-password",
  dynamicRateLimiter,validatePassword,
  sanitizeInput,
  userController.resetPassword
);

// 🔹 Mendapatkan data pengguna
router.get("/getData", dynamicRateLimiter, userController.getData);

// 🔹 Mendapatkan jumlah user QC
router.get("/countQcUser", dynamicRateLimiter, userController.countQCUsers);

// 🔹 Mendapatkan data token
router.get("/auth/me", verifyToken, (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  res.json({
    id: req.user.id,
    email: req.user.email,
    inisial: req.user.inisial,
    nama_lengkap: req.user.nama_lengkap,
    userrole: req.user.userrole,
    img: req.user.img,
  });
});

// 🔹 Mendapatkan semua pengguna dengan status pending
router.get(
  "/pendingUsers",
  verifyToken,
  updateTokenExpiry,
  userController.getPendingUsers
);

// 🔹 Mendapatkan semua pengguna
router.get("/getUsers", userController.getAllUsers);

//🔹 routes log activity
router.get("/searchUserLogs", dynamicRateLimiter, logController.searchUserLogs);

router.get("/data-monitoring", monitoringData.dataMonitoringQc);

// 🔹 Menghapus user
router.delete(
  "/deleteUser/:id",
  dynamicRateLimiter,
  verifyToken,
  updateTokenExpiry,
  authorizeRoles("admin", "super admin"),
  userController.deleteUserById
);

// 🔹 Menyetujui atau menolak pengguna
router.patch(
  "/updateUserStatus/:id",
  dynamicRateLimiter,
  verifyToken,
  updateTokenExpiry,
  authorizeRoles("admin", "super admin"),
  async (req, res) => {
    const { id } = req.params; // Mendapatkan ID user dari parameter URL
    const { status, userRole, updated_at, updated_by } = req.body; // Mendapatkan data dari request body

    // Cek apakah data body lengkap
    if (!status || !userRole || !updated_at || !updated_by) {
      console.log("⛔ Missing fields in request body:", req.body);
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }
    try {
      // Ambil data user
      const [userRows] = await db.query(
        "SELECT email, nama_lengkap FROM user WHERE id = ?",
        [id]
      );
      if (userRows.length === 0) {
        return res.status(404).json({ message: "User tidak ditemukan." });
      }

      const userEmail = userRows[0].email;
      const userName = userRows[0].nama_lengkap;

      // Update status user
      const query = `
              UPDATE user 
              SET status = ?, userrole = ?, updated_at = ?, updated_by = ? 
              WHERE id = ?;
            `;
      const values = [status, userRole, updated_at, updated_by, id];
      const [result] = await db.query(query, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User tidak ditemukan." });
      }

      // Kirim email sesuai status
      const subject = "Status Akun Anda Telah Diperbarui";
      const text =
        status === "Accept"
          ? `Halo ${userName},\n\nAkun Anda telah disetujui oleh admin.\nSilakan login untuk melanjutkan.\n\nTerima kasih.`
          : `Halo ${userName},\n\nAkun Anda telah ditolak oleh admin.\nSilakan konfirmasi ke Supervisor QC untuk lebih lanjut.\n\nTerima kasih.`;

      await sendStatusEmail(userEmail, subject, text);

      logActivity(updated_by, `Update status user ID ${id} ke ${status}`, req);

      return res.status(200).json({
        message: "Status user berhasil diupdate dan email dikirim.",
        data: { id, status, userRole },
      });
    } catch (err) {
      console.error("❌ Error:", err);
      return res
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

// 🔹Mendapatkan detail pengguna berdasarkan ID
router.get("/detail/:userId", dynamicRateLimiter, userController.getUserById);

module.exports = router;
