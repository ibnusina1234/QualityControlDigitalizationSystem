const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const db = require("../database/db");
const db1 = require("../database/dbForKS");
const saltRounds = 10;
require("dotenv").config();
const logActivity = require("../helpers/logger");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const { updateProfileSchema } = require("../Validations/userValidations");

// Konfigurasi Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Input tidak valid:", errors.array());
      }
      return res
        .status(400)
        .json({ error: "Invalid input", details: errors.array() });
    }

    const { email, nama_lengkap, inisial, departement, jabatan, password,role } =
      req.body;

    // Ambil permissions dari req.body (jika FormData, perlu parse JSON)
    let permissions = [];
    if (req.body.permissions) {
      try {
        permissions = JSON.parse(req.body.permissions);
      } catch (e) {
        permissions = Array.isArray(req.body.permissions)
          ? req.body.permissions
          : [req.body.permissions];
      }
    }
    const imgPath = req.file ? `public/uploads/${req.file.filename}` : null;

    if (process.env.NODE_ENV !== "production") {
      console.log("Data diterima untuk register:", {
        email,
        nama_lengkap,
        inisial,
        departement,
        jabatan,
        role,
        imgPath,
        permissions,
      });
    }

    const hash = await bcrypt.hash(password, saltRounds);
    const userId = uuidv4();

    // Insert user ke tabel user
    const [result] = await db.execute(
      `INSERT INTO user (id, email, nama_lengkap, inisial, departement, jabatan, password, userrole, img, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?,?, ?, 'Active')`,
      [
        userId,
        email,
        nama_lengkap,
        inisial,
        departement,
        jabatan,
        hash,
        role,
        imgPath,
      ]
    );



    if (process.env.NODE_ENV !== "production") {
      console.log("User berhasil didaftarkan ke database:", result);
    }

    try {
      await sendApprovalEmail(email, nama_lengkap);
      if (process.env.NODE_ENV !== "production") {
        console.log("Approval email berhasil dikirim ke admin.");
      }
    } catch (emailErr) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Gagal mengirim approval email:", emailErr.message);
      }
    }

    res.status(201).json({
      message: "User registered!.",
    });

    logActivity(nama_lengkap, "Register", req).catch((logErr) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Gagal log aktivitas:", logErr.message);
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Kesalahan tidak terduga dalam registerUser:", err.message);
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Mendapatkan akses/permissions user berdasarkan user id
exports.getUserAccess = async (req, res) => {
  try {
    // Debug: Log user information
    console.log("User Role:", req.user?.userrole); 

    // Get the user's role key from req.user
    const userRoleKey = req.user?.userrole;
    if (!userRoleKey) {
      return res.status(400).json({ error: "User role not found" });
    }

    // First, get the role_id from the roles table based on role_key
    const [roleResult] = await db.execute(
      `SELECT id FROM roles WHERE role_key = ?`,
      [userRoleKey]
    );

    if (roleResult.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    const roleId = roleResult[0].id;

    // Then get all permissions associated with this role from role_default_permissions
    const [permissions] = await db.execute(
      `SELECT p.permission_key 
       FROM role_default_permissions rdp
       JOIN permissions p ON rdp.permission_id = p.id
       WHERE rdp.role_id = ?`,
      [roleId]
    );

    res.json({ 
      success: true,
      permissions: permissions.map(p => p.permission_key) 
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ 
      error: "Database operation failed",
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

//edit user akses
exports.updateUserAccess = async (req, res) => {
  const { id } = req.params;
  const { access } = req.body; // access = array of string
  if (!Array.isArray(access)) {
    return res.status(400).json({ error: "Access harus array" });
  }
  try {
    // Hapus akses lama
    await db.execute("DELETE FROM role_permissions WHERE user_id = ?", [id]);
    // Insert akses baru (bulk insert)
    if (access.length > 0) {
      const values = access.map((a) => [id, a]);
      await db.query(
        "INSERT INTO role_permissions (user_id, permission) VALUES ?",
        [values]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal update akses user." });
  }
};

//Check Email agar tidak ada email ganda
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const [rows] = await db.execute(
      "SELECT COUNT(*) AS count FROM user WHERE email = ?",
      [email]
    );

    const exists = rows[0].count > 0;

    // Log the activity if a user is checking email availability
    // Using req.user?.id to get the user ID if authenticated, or null if not
    if (req.user?.id) {
      logActivity(req.user.id, "Email Availability Check", req).catch(
        (logErr) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Gagal log aktivitas:", logErr.message);
          }
        }
      );
    }

    return res.json({ exists });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Database error:", err?.message || err);
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
// Fungsi untuk mengirim email notifikasi ke admin
const getAdminEmails = async () => {
  try {
    const [rows] = await db.execute(
      "SELECT email FROM user WHERE userrole = ?",
      ["admin", "super admin"]
    );

    const adminEmails = rows.map((row) => row.email);
    if (process.env.NODE_ENV !== "production") {
      console.log("Admin Emails:", adminEmails);
    }

    return adminEmails;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Database query error:", err?.message || err);
    }
    throw new Error("Failed to retrieve admin emails");
  }
};

const sendApprovalEmail = async (email, nama_lengkap) => {
  try {
    const adminEmails = await getAdminEmails();

    if (!adminEmails || !adminEmails.length) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("No admin emails found.");
      }
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails.join(","),
      subject: "Persetujuan Akun Baru",
      text: `Akun baru telah didaftarkan oleh ${nama_lengkap} (${email}). Silakan login ke sistem untuk menyetujui.`,
    };

    // Tambahkan timeout ke dalam email agar tidak menggantung
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout: sendMail terlalu lama")),
          10000
        )
      ), // 10 detik timeout
    ]);

    if (process.env.NODE_ENV !== "production") {
      console.log("Approval email sent successfully.");
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error sending approval email:", err?.message || err);
    }
    // Jangan lempar error jika dipanggil di background, cukup log
    // throw err; // ❌ Hanya lempar jika ingin gagal total (sudah tidak direkomendasikan untuk route)
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    // Cek validasi input
    const errors = validationResult(req);
    const BACKEND_URL = process.env.BACKEND_URL;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Query database untuk mencari user berdasarkan email
    const [users] = await db.execute("SELECT * FROM user WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Pastikan status user adalah 'Active' sebelum melanjutkan
    if (user.status !== "Active") {
      return res
        .status(403)
        .json({ error: "User is not Active. Please Contact Administrator" });
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // get user permissions
    const [permissions] = await db.execute(
      "SELECT permission FROM role_permissions WHERE user_id = ?",
      [user.id]
    );
    const userPermissions = permissions.map((p) => p.permission);

    // Cek apakah user harus reset password
    const mustChangePassword = user.last_change_password === null;

    // Buat payload untuk JWT
    const payload = {
      id: user.id,
      email: user.email,
      userrole: user.userrole,
      jabatan: user.jabatan,
      nama_lengkap: user.nama_lengkap,
      inisial: user.inisial,
      img: user.img
        ? `${BACKEND_URL}/${user.img.replace("public/", "")}`
        : null,
      permissions: userPermissions,
      mustChangePassword, // <-- opsional: juga di payload token, jika perlu
    };

    // Generate token JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "1h",
    });

    // Set token ke cookie HttpOnly
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict", // anti-CSRF
      maxAge: 3600000, // 1 jam (bisa disesuaikan)
    });

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user;

    logActivity(user.id, "Login", req).catch((logErr) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Gagal log aktivitas:", logErr.message);
      }
    });

    res.json({
      message: "Login successful",
      user: {
        ...userWithoutPassword,
        img: user.img
          ? `${BACKEND_URL}/${user.img.replace("public/", "")}`
          : null,
        mustChangePassword, // <-- tambahkan di response
        permissions: userPermissions,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Login error:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // Atur true jika sudah pakai HTTPS di production
      sameSite: "Strict",
      path: "/", // Sangat penting agar cocok dengan cookie saat login
    });
    return res.status(200).json({ message: "Logout berhasil" });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Logout error:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify token
exports.verifyToken = (req, res) => {
  try {
    const token = req.cookies.token; // ambil dari cookie sekarang

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Log the token verification
      if (decoded?.id) {
        logActivity(decoded.id, "Token Verification", req).catch((logErr) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Gagal log aktivitas:", logErr.message);
          }
        });
      }

      res.json({ user: decoded });
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Verify token error:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const [results] = await db.execute(
      "SELECT id,email, nama_lengkap, inisial, departement, jabatan, userrole, img FROM user WHERE id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(results[0]);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Database error:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

//get userrole
exports.getUserRole = async (req, res) => {
  // Ambil userId dari parameter id yang dikirim oleh frontend
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const [results] = await db.execute(
      "SELECT userrole FROM user WHERE id = ?",
      [userId]
    );

    // Periksa jika tidak ada hasil ditemukan
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Kembalikan hanya userrole
    res.json({ userrole: results[0].userrole });
  } catch (err) {
    // Log error jika bukan dalam mode produksi
    if (process.env.NODE_ENV !== "production") {
      console.error("Database error:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const userId = req.user?.id;
  const userRoleFromToken = req.user?.userrole;
  const imgPath = req.file ? `public/uploads/${req.file.filename}` : null;

  if (!userId) {
    return res.status(400).json({ error: "User ID diperlukan." });
  }

  // Validasi dengan Joi langsung dari req.body
  const { error, value } = updateProfileSchema.validate(req.body, {
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // Destructuring nilai hasil validasi
  const { email, nama_lengkap, inisial, departement, jabatan, userrole } =
    value;

  try {
    let sql = `
      UPDATE user 
      SET email = ?, nama_lengkap = ?, inisial = ?, departement = ?, jabatan = ?
    `;
    const params = [email, nama_lengkap, inisial, departement, jabatan];

    if (userRoleFromToken === "admin" && userrole) {
      sql += ", userrole = ?";
      params.push(userrole);
    }

    if (imgPath) {
      sql += ", img = ?";
      params.push(imgPath);
    }

    sql += " WHERE id = ?";
    params.push(userId);

    const [result] = await db.execute(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User tidak ditemukan." });
    }

    // Opsional logging
    if (typeof logActivity === "function") {
      logActivity(userId, "Update Profile", req).catch((logErr) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Gagal log aktivitas:", logErr.message);
        }
      });
    }

    res.json({ message: "Profil berhasil diperbarui!" });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Update profile error:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller: Update userrole saja (oleh admin/super admin)
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { userrole } = req.body;
  const requesterRole = req.user.userrole; // role dari yang melakukan request (harus dari middleware verifyToken)

  if (!id) {
    return res.status(400).json({ error: "User ID diperlukan." });
  }
  if (!userrole) {
    return res.status(400).json({ error: "Field userrole wajib diisi." });
  }
  // Hanya admin atau super admin yang boleh update userrole
  if (!(requesterRole === "admin" || requesterRole === "super admin")) {
    return res.status(403).json({ error: "Tidak diizinkan mengganti role user." });
  }

  try {
    // Ambil daftar role_key dari tabel roles
    const [roles] = await db.execute("SELECT role_key FROM roles");
    const allowedRoles = roles.map(r => r.role_key);

    // Validasi userrole dengan daftar role_key
    if (!allowedRoles.includes(userrole)) {
      return res.status(400).json({ error: "userrole tidak valid." });
    }

    const [result] = await db.execute(
      "UPDATE user SET userrole = ? WHERE id = ?",
      [userrole, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User tidak ditemukan." });
    }
    // (Opsional logging aktivitas)
    if (typeof logActivity === "function") {
      logActivity(
        req.user.id,
        `Update userrole user ${id} menjadi ${userrole}`,
        req
      ).catch(() => {});
    }
    res.json({ message: "Userrole berhasil diupdate." });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Update userrole error:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware check role
exports.checkRole = (roles) => {
  return async (req, res, next) => {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    try {
      const [results] = await db.execute(
        "SELECT userrole FROM user WHERE id = ?",
        [userId]
      );
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = results[0].userrole;
      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      next();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Role check error:", err?.message || err);
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

exports.countQCUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM user WHERE departement = ?",
      ["QC"]
    );

    return res.status(200).json({
      success: true,
      count: rows[0].count,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error counting QC users:", error?.message || error);
    }
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const [results] = await db.query("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    if (results.length === 0)
      return res.status(404).json({ error: "User not found" });

    const user = results[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = moment()
      .tz("Asia/Jakarta")
      .add(1, "hour")
      .format("YYYY-MM-DD HH:mm:ss");

    await db.query(
      "UPDATE user SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?",
      [resetToken, resetTokenExpiry, email]
    );

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    const mailOptions = {
      from: `"No-Reply" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset.\n\nReset your password here: ${resetUrl}\n\nIf you did not request this, please ignore.`,
    };

    await transporter.sendMail(mailOptions);

    // Log the password reset request
    logActivity(user.id, "Password Reset Request", req).catch((logErr) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Gagal log aktivitas:", logErr.message);
      }
    });

    res.json({ message: "Password reset email sent!" });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error in password reset request:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password are required" });
  }

  try {
    let user;
    // Jika ada token, berarti reset via forgot password
    if (token) {
      const [results] = await db.query(
        "SELECT * FROM user WHERE email = ? AND resetToken = ? AND resetTokenExpiry > NOW()",
        [email, token]
      );
      if (results.length === 0)
        return res.status(400).json({ error: "Invalid or expired token" });
      user = results[0];
    } else {
      // Reset password tanpa token (misal: login pertama kali)
      const [results] = await db.query(
        "SELECT * FROM user WHERE email = ?",
        [email]
      );
      if (results.length === 0)
        return res.status(404).json({ error: "User not found" });
      user = results[0];
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.query(
      "UPDATE user SET password = ?, resetToken = NULL, resetTokenExpiry = NULL, last_change_password = NOW() WHERE email = ?",
      [hashedPassword, email]
    );

    // Log the password reset completion
    logActivity(user.id, "Password Reset Complete", req).catch((logErr) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Gagal log aktivitas:", logErr.message);
      }
    });

    res.json({ message: "Password reset successful!" });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error resetting password:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};


// Fetch Pending Users
exports.getPendingUsers = async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM user WHERE status = 'Pending'"
    );
    res.json(results);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error fetching pending users:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fetch User by ID
exports.getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await db.query("SELECT * FROM user WHERE id = ?", [
      userId,
    ]);

    if (results.length === 0)
      return res.status(404).json({ error: "User not found" });

    // Log the activity of viewing user details
    if (req.user?.id) {
      logActivity(req.user.id, `View User Detail (ID: ${userId})`, req).catch(
        (logErr) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Gagal log aktivitas:", logErr.message);
          }
        }
      );
    }

    res.json(results[0]);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error fetching user by id:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update User Status
exports.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status, userRole, updated_at, updated_by } = req.body;

  if (!status || !userRole || !updated_at || !updated_by) {
    return res.status(400).json({ error: "Some required fields are missing" });
  }

  try {
    const [result] = await db.query(
      "UPDATE user SET status = ?, userrole = ?, updated_at = ?, updated_by = ? WHERE id = ?",
      [status, userRole, updated_at, updated_by, parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    logActivity(
      updated_by,
      `Updated user ID ${id} status to ${status}`,
      req
    ).catch((logErr) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Gagal log aktivitas:", logErr.message);
      }
    });

    res.json({ message: "User status updated successfully!" });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error updating user status:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM user");

    // Log the activity of viewing all users
    if (req.user?.id) {
      logActivity(req.user.id, "View All Users", req).catch((logErr) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Gagal log aktivitas:", logErr.message);
        }
      });
    }

    res.json(results);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error fetching all users:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete User by ID
exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Cari user
    const [users] = await db.execute("SELECT * FROM user WHERE id = ?", [id]);
    const userToDelete = users[0];
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Tidak boleh hapus diri sendiri
    if (userToDelete.id.toString() === currentUser.id.toString()) {
      return res.status(403).json({ message: "Cannot delete yourself" });
    }

    // Admin tidak boleh hapus super admin
    if (
      currentUser.userrole === "admin" &&
      userToDelete.userrole === "super admin"
    ) {
      return res
        .status(403)
        .json({ message: "Admin cannot delete super admin" });
    }

    // Hapus relasi di tabel lain dulu (misal role_permissions)
    await db.execute("DELETE FROM role_permissions WHERE user_id = ?", [id]);
    // Tambahkan hapus tabel lain jika ada

    // Hapus user
    const [result] = await db.execute("DELETE FROM user WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "User not found or already deleted" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Anti-spam control
let lastSent = {};

// Send Temperature Alert
exports.sendTemperatureAlert = async (req, res) => {
  try {
    const { room, temperature, time } = req.body;
    if (!room || temperature === undefined || !time) {
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });
    }

    const now = Date.now();

    // Cek apakah email untuk room ini sudah dikirim dalam 1 jam terakhir (3600000 ms)
    if (lastSent[room] && now - lastSent[room] < 3600000) {
      return res.status(429).json({
        success: false,
        message: `Email alert for room ${room} was sent recently. Please wait.`,
      });
    }

    // Hanya kirim email jika suhu di luar rentang 20–28
    if (temperature >= 20 && temperature <= 28) {
      return res.status(200).json({
        success: true,
        message: "Temperature is within normal range. No alert sent.",
      });
    }

    const [rows] = await db.query(
      "SELECT email FROM user WHERE departement = 'QC'"
    );
    const emailList = rows.map((row) => row.email);
    const roundedTemp = parseFloat(temperature).toFixed(1);

    let warningMessage = "";
    let subject = "";

    if (temperature < 20) {
      subject = `⚠️ Suhu Rendah di ${room}`;
      warningMessage = `
        <p><strong>Waspada!</strong> Suhu di <strong>${room}</strong> kurang dari batas normal.</p>
        <p>Suhu saat ini: <strong>${roundedTemp}°C</strong></p>
        <p>Waktu: ${new Date(time).toLocaleString()}</p>
      `;
    } else if (temperature > 28) {
      subject = `⚠️ Suhu Tinggi di ${room}`;
      warningMessage = `
        <p><strong>Waspada!</strong> Suhu di <strong>${room}</strong> melebihi batas normal.</p>
        <p>Suhu saat ini: <strong>${roundedTemp}°C</strong></p>
        <p>Waktu: ${new Date(time).toLocaleString()}</p>
      `;
    }

    const mailOptions = {
      from: `"Monitoring QC" <${process.env.EMAIL_USER}>`,
      to: emailList.join(","),
      subject,
      html: warningMessage,
    };

    await transporter.sendMail(mailOptions);

    // Update waktu terakhir email dikirim untuk room ini
    lastSent[room] = now;

    res
      .status(200)
      .json({ success: true, message: "Alert email sent to admins" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "Gagal mengambil data / mengirim email:",
        error?.message || error
      );
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// Search User Logs with Pagination or PDF Export
exports.searchUserLogs = async (req, res) => {
  const {
    start_date,
    end_date,
    format,
    page = 1,
    limit = 10,
    ...filters
  } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = "SELECT * FROM user_logs WHERE 1=1";
  let values = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      sql += ` AND ${key} LIKE ?`;
      values.push(`%${value}%`);
    }
  }

  if (start_date && end_date) {
    sql += " AND created_at BETWEEN ? AND ?";
    values.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
  }

  const countSql =
    "SELECT COUNT(*) AS total FROM user_logs WHERE 1=1" + sql.slice(25);
  const paginatedSql = `${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const paginatedValues = [...values, parseInt(limit), offset];

  try {
    // Log the activity of searching logs
    if (req.user?.id) {
      const logParams = {
        start_date,
        end_date,
        format: format || "json",
        filters: JSON.stringify(filters),
      };

      logActivity(
        req.user.id,
        `Search User Logs (${JSON.stringify(logParams)})`,
        req
      ).catch((logErr) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Gagal log aktivitas:", logErr.message);
        }
      });
    }

    if (format === "pdf") {
      const [results] = await db.query(sql, values);
      const doc = new PDFDocument({ margin: 30 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=user_logs.pdf"
      );
      doc.pipe(res);

      doc.fontSize(18).text("User Logs Report", { align: "center" }).moveDown();
      results.forEach((log, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. User: ${log.user_id}\nAction: ${
              log.activity
            }\nDate: ${moment(log.created_at).format("YYYY-MM-DD HH:mm:ss")}`
          )
          .moveDown();
      });
      doc.end();
    } else {
      const [data] = await db.query(paginatedSql, paginatedValues);
      const [count] = await db.query(countSql, values);

      res.json({
        page: parseInt(page),
        limit: parseInt(limit),
        total: count[0].total,
        data,
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error searching user logs:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Ambil semua role dan permission-nya
exports.getAllRolesWithPermissions = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles');
    const [permissions] = await db.query('SELECT * FROM permissions');
    const [mappings] = await db.query('SELECT * FROM role_default_permissions');

    const roleMap = roles.map(role => {
      const permissionIds = mappings
        .filter(m => m.role_id === role.id)
        .map(m => m.permission_id);

      const assignedPermissions = permissions
        .filter(p => permissionIds.includes(p.id))
        .map(p => p.permission_key);

      return {
        role_key: role.role_key,
        role_name: role.role_name,
        icon: role.icon,
        category: role.category,
        description: role.description,
        access: assignedPermissions
      };
    });

    // Log the activity
    if (req.user?.id) {
      logActivity(req.user.id, "Viewed all roles with permissions", req);
    }

    res.json(roleMap);
  } catch (err) {
    console.error('Error getting role permissions:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Ambil semua permission
exports.getAllPermissions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM permissions');

    // Log the activity
    if (req.user?.id) {
      logActivity(req.user.id, "Viewed all permissions", req);
    }

    res.json(rows);
  } catch (err) {
    console.error('Error getting permissions:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Ambil permission dari satu role
exports.getPermissionsByRoleKey = async (req, res) => {
  const { roleKey } = req.params;
  try {
    const [[role]] = await db.query('SELECT * FROM roles WHERE role_key = ?', [roleKey]);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    const [mappings] = await db.query(
      `SELECT p.permission_key FROM role_default_permissions rdp
       JOIN permissions p ON p.id = rdp.permission_id
       WHERE rdp.role_id = ?`, [role.id]);

    const permissionKeys = mappings.map(row => row.permission_key);

    // Log the activity
    if (req.user?.id) {
      logActivity(req.user.id, `Viewed permissions for role: ${roleKey}`, req);
    }

    res.json({ role_key: roleKey, permissions: permissionKeys });
  } catch (err) {
    console.error('Error getting role permissions:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update permission untuk satu role
exports.updatePermissionsForRole = async (req, res) => {
  const { roleKey } = req.params;
  const { permissions = [] } = req.body;

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: 'Permissions should be an array' });
  }

  const connection = await db.getConnection(); // ambil koneksi dari pool
  try {
    await connection.beginTransaction();

    const [[role]] = await connection.query(
      'SELECT * FROM roles WHERE role_key = ?', [roleKey]
    );
    if (!role) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Role not found' });
    }

    // Get old permissions for logging
    const [oldMappings] = await connection.query(
      `SELECT p.permission_key FROM role_default_permissions rdp
       JOIN permissions p ON p.id = rdp.permission_id
       WHERE rdp.role_id = ?`, [role.id]);
    const oldPermissions = oldMappings.map(row => row.permission_key);

    const [allPermissions] = await connection.query('SELECT * FROM permissions');
    const validPermissionMap = new Map(allPermissions.map(p => [p.permission_key, p.id]));

    const permissionIds = permissions.map(key => validPermissionMap.get(key)).filter(Boolean);

    await connection.query('DELETE FROM role_default_permissions WHERE role_id = ?', [role.id]);

    if (permissionIds.length > 0) {
      const values = permissionIds.map(pid => [role.id, pid]);
      await connection.query(
        'INSERT INTO role_default_permissions (role_id, permission_id) VALUES ?', [values]
      );
    }

    await connection.commit();
    connection.release();

    // Log the activity
    if (req.user?.id) {
      logActivity(
        req.user.id, 
        `Updated permissions for role ${roleKey}: removed [${oldPermissions.join(', ')}], added [${permissions.join(', ')}]`, 
        req
      );
    }

    res.json({ message: 'Permissions updated successfully' });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error updating permissions:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

//create role
exports.createRole = async (req, res) => {
  const { role_key, role_name, icon, is_active, description } = req.body;

  if (!role_key || !role_name) {
    return res.status(400).json({ message: 'Role key and name are required' });
  }

  try {
    // Cek apakah role_key sudah ada
    const [existingRoles] = await db.query('SELECT * FROM roles WHERE role_key = ?', [role_key]);
    if (existingRoles.length > 0) {
      return res.status(400).json({ message: 'Role key already exists' });
    }
    // Cek apakah role_name sudah ada
    const [existingNames] = await db.query('SELECT * FROM roles WHERE role_name = ?', [role_name]);
    if (existingNames.length > 0) {
      return res.status(400).json({ message: 'Role name already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO roles (role_key, role_name, icon, is_active, description, created_at, updated_at) VALUES (?, ?, ?, 1, ?, NOW(), NOW())',
      [role_key, role_name, icon || null, description || null]
    );

    // Log the activity
    if (req.user?.id) {
      logActivity(
        req.user.id, 
        `Created new role: ${role_name} (${role_key}) with description: ${description || 'No description'}`, 
        req
      );
    }

    res.status(201).json({ message: 'Role created successfully', id: result.insertId });
  } catch (err) {
    console.error('Error creating role:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

//update existing role
exports.updateRole = async (req, res) => {
  const { roleKey } = req.params;
  const { role_name, icon, is_active, description } = req.body;
  
  if (!role_name) {
    return res.status(400).json({ message: 'Role name is required' });
  }
  
  try {
    // Get old role data for logging
    const [[oldRole]] = await db.query('SELECT * FROM roles WHERE role_key = ?', [roleKey]);
    if (!oldRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const [result] = await db.query(
      'UPDATE roles SET role_name = ?, icon = ?, is_active = ?, description = ?, updated_at = NOW() WHERE role_key = ?',
      [role_name, icon || null, is_active || 1, description || null, roleKey]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Log the activity with changes
    if (req.user?.id) {
      const changes = [];
      if (oldRole.role_name !== role_name) changes.push(`name: '${oldRole.role_name}' → '${role_name}'`);
      if (oldRole.icon !== (icon || null)) changes.push(`icon: '${oldRole.icon}' → '${icon || null}'`);
      if (oldRole.is_active !== (is_active || 1)) changes.push(`status: ${oldRole.is_active ? 'active' : 'inactive'} → ${(is_active || 1) ? 'active' : 'inactive'}`);
      if (oldRole.description !== (description || null)) changes.push(`description: '${oldRole.description}' → '${description || null}'`);
      
      logActivity(
        req.user.id, 
        `Updated role ${roleKey}: ${changes.length > 0 ? changes.join(', ') : 'No changes detected'}`, 
        req
      );
    }
    
    res.json({ message: 'Role updated successfully' });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete role
exports.deleteRole = async (req, res) => {
  const { roleKey } = req.params;

  try {
    // Get role data before deletion for logging
    const [[roleToDelete]] = await db.query('SELECT * FROM roles WHERE role_key = ?', [roleKey]);
    if (!roleToDelete) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Get associated permissions for logging
    const [associatedPermissions] = await db.query(
      `SELECT p.permission_key FROM role_default_permissions rdp
       JOIN permissions p ON p.id = rdp.permission_id
       WHERE rdp.role_id = ?`, [roleToDelete.id]);
    const permissionKeys = associatedPermissions.map(row => row.permission_key);

    const [result] = await db.query('DELETE FROM roles WHERE role_key = ?', [roleKey]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Hapus juga relasi di role_default_permissions (CASCADE should handle this, but being explicit)
    await db.query('DELETE FROM role_default_permissions WHERE role_id = ?', [roleToDelete.id]);

    // Log the activity
    if (req.user?.id) {
      logActivity(
        req.user.id, 
        `Deleted role: ${roleToDelete.role_name} (${roleKey}) with permissions: [${permissionKeys.join(', ') || 'No permissions'}]`, 
        req
      );
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Create permission
exports.createPermission = async (req, res) => {
  const { permission_key, permission_name, description, category } = req.body;
  
  if (!permission_key || !permission_name) {
    return res.status(400).json({ message: 'Permission key and name are required' });
  }
  
  try {
    // Cek apakah permission_key sudah ada
    const [existingPermissions] = await db.query('SELECT * FROM permissions WHERE permission_key = ?', [permission_key]);
    if (existingPermissions.length > 0) {
      return res.status(400).json({ message: 'Permission key already exists' });
    }
    
    const [result] = await db.query(
      'INSERT INTO permissions (permission_key, permission_name, description, category, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [permission_key, permission_name, description || null, category || null]
    );

    // Log the activity
    if (req.user?.id) {
      logActivity(
        req.user.id, 
        `Created new permission: ${permission_name} (${permission_key}) in category: ${category || 'No category'} with description: ${description || 'No description'}`, 
        req
      );
    }
    
    res.status(201).json({ message: 'Permission created successfully', id: result.insertId });
  } catch (err) {
    console.error('Error creating permission:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update existing permission
exports.updatePermission = async (req, res) => {
  const { permissionKey } = req.params;
  const { permission_name, description, category } = req.body;

  if (!permission_name) {
    return res.status(400).json({ message: 'Permission name is required' });
  }

  try {
    // Get old permission data for logging
    const [[oldPermission]] = await db.query('SELECT * FROM permissions WHERE permission_key = ?', [permissionKey]);
    if (!oldPermission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    const [result] = await db.query(
      'UPDATE permissions SET permission_name = ?, description = ?, category = ?, updated_at = NOW() WHERE permission_key = ?',
      [permission_name, description || null, category || null, permissionKey]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Log the activity with changes
    if (req.user?.id) {
      const changes = [];
      if (oldPermission.permission_name !== permission_name) changes.push(`name: '${oldPermission.permission_name}' → '${permission_name}'`);
      if (oldPermission.description !== (description || null)) changes.push(`description: '${oldPermission.description}' → '${description || null}'`);
      if (oldPermission.category !== (category || null)) changes.push(`category: '${oldPermission.category}' → '${category || null}'`);
      
      logActivity(
        req.user.id, 
        `Updated permission ${permissionKey}: ${changes.length > 0 ? changes.join(', ') : 'No changes detected'}`, 
        req
      );
    }

    res.json({ message: 'Permission updated successfully' });
  } catch (err) {
    console.error('Error updating permission:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete permission
exports.deletePermission = async (req, res) => {
  const { permissionKey } = req.params;
  
  try {
    // Get permission data before deletion for logging
    const [[permissionToDelete]] = await db.query('SELECT * FROM permissions WHERE permission_key = ?', [permissionKey]);
    if (!permissionToDelete) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Get roles that have this permission for logging
    const [associatedRoles] = await db.query(
      `SELECT r.role_key, r.role_name FROM role_default_permissions rdp
       JOIN roles r ON r.id = rdp.role_id
       WHERE rdp.permission_id = ?`, [permissionToDelete.id]);
    const roleKeys = associatedRoles.map(row => `${row.role_name} (${row.role_key})`);

    const [result] = await db.query('DELETE FROM permissions WHERE permission_key = ?', [permissionKey]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    
    // Hapus juga relasi di role_default_permissions (CASCADE should handle this, but being explicit)
    await db.query('DELETE FROM role_default_permissions WHERE permission_id = ?', [permissionToDelete.id]);

    // Log the activity
    if (req.user?.id) {
      logActivity(
        req.user.id, 
        `Deleted permission: ${permissionToDelete.permission_name} (${permissionKey}) from category: ${permissionToDelete.category || 'No category'}, removed from roles: [${roleKeys.join(', ') || 'No roles'}]`, 
        req
      );
    }
    
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    console.error('Error deleting permission:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};