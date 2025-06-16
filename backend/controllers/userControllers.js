const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const db = require("../database/dbForKS");
const db1 = require("../database/db");
const saltRounds = 10;
require("dotenv").config();
const logActivity = require("../helpers/logger");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const {
  updateProfileSchema,
} = require("../Validations/userValidations");

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

    const { email, nama_lengkap, inisial, departement, jabatan, password } =
      req.body;
    const imgPath = req.file ? `public/uploads/${req.file.filename}` : null;

    if (process.env.NODE_ENV !== "production") {
      console.log("Data diterima untuk register:", {
        email,
        nama_lengkap,
        inisial,
        departement,
        jabatan,
        imgPath,
      });
    }

    const hash = await bcrypt.hash(password, saltRounds);
    const userId = uuidv4();

    const [result] = await db1.execute(
      `INSERT INTO user (id, email, nama_lengkap, inisial, departement, jabatan, password, img, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        userId,
        email,
        nama_lengkap,
        inisial,
        departement,
        jabatan,
        hash,
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
      message: "User registered! Waiting for admin approval.",
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

//Check Email agar tidak ada email ganda
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const [rows] = await db1.execute(
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
    const [rows] = await db1.execute(
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
    const [users] = await db1.execute("SELECT * FROM user WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Pastikan status user adalah 'Accept' sebelum melanjutkan
    if (user.status !== "Accept") {
      return res.status(403).json({ error: "User is not approved" });
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

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
      user: userWithoutPassword, // Tidak perlu kirim token di response!
      img: user.img
        ? `${BACKEND_URL}/${user.img.replace("public/", "")}`
        : null,
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
    const [results] = await db1.execute(
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
  const {
    email,
    nama_lengkap,
    inisial,
    departement,
    jabatan,
    userrole,
  } = value;

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

    const [result] = await db1.execute(sql, params);

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
  const { id } = req.params; // id user yang akan diupdate
  const { userrole } = req.body;
  const requesterRole = req.user.userrole; // role dari yang melakukan request (harus dari middleware verifyToken)

  if (!id) {
    return res.status(400).json({ error: "User ID diperlukan." });
  }
  if (!userrole) {
    return res.status(400).json({ error: "Field userrole wajib diisi." });
  }
  if (!["admin", "super admin", "user"].includes(userrole)) {
    return res.status(400).json({ error: "userrole tidak valid." });
  }
  // Hanya admin atau super admin yang boleh update userrole
  if (!(requesterRole === "admin" || requesterRole === "super admin")) {
    return res
      .status(403)
      .json({ error: "Tidak diizinkan mengganti role user." });
  }

  try {
    const [result] = await db1.execute(
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
      const [results] = await db1.execute(
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
    const [rows] = await db1.query(
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
    const [results] = await db1.query("SELECT * FROM user WHERE email = ?", [
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

    await db1.query(
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
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [results] = await db1.query(
      "SELECT * FROM user WHERE email = ? AND resetToken = ? AND resetTokenExpiry > NOW()",
      [email, token]
    );
    if (results.length === 0)
      return res.status(400).json({ error: "Invalid or expired token" });

    const user = results[0];
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db1.query(
      "UPDATE user SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE email = ?",
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

// Get Application Data
exports.getData = async (req, res) => {
  try {
    const [results] = await db1.query(
      "SELECT newsData, partOfUsData, organizationStructure FROM app_data WHERE id = 1"
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Data not found" });
    }

    // Log the application data retrieval
    if (req.user?.id) {
      logActivity(req.user.id, "Retrieve Application Data", req).catch(
        (logErr) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Gagal log aktivitas:", logErr.message);
          }
        }
      );
    }

    const data = results[0];
    res.json({
      newsData: JSON.parse(data.newsData),
      partOfUsData: JSON.parse(data.partOfUsData),
      organizationStructure: JSON.parse(data.organizationStructure),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error getting app data:", err?.message || err);
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fetch Pending Users
exports.getPendingUsers = async (req, res) => {
  try {
    const [results] = await db1.query(
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
    const [results] = await db1.query("SELECT * FROM user WHERE id = ?", [
      userId,
    ]);

    if (results.length === 0)
      return res.status(404).json({ error: "User not found" });

    // Log the activity of viewing user details
    if (req.user?.id) {
      logActivity(
        req.user.id,
        `View User Detail (ID: ${userId})`,
        req
      ).catch((logErr) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Gagal log aktivitas:", logErr.message);
        }
      });
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
    const [result] = await db1.query(
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
    const [results] = await db1.query("SELECT * FROM user");

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
  const { id } = req.params;
  try {
    await db1.query("DELETE FROM user WHERE id = ?", [id]);

    // Log the user deletion activity
    if (req.user?.id) {
      logActivity(req.user.id, `Delete User (ID: ${email})`, req).catch(
        (logErr) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Gagal log aktivitas:", logErr.message);
          }
        }
      );
    }

    res.json({ message: "User successfully deleted" });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error deleting user:", err?.message || err);
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Anti-spam control
let lastSent = {};

// Send Temperature Alert
exports.sendTemperatureAlert = async (req, res) => {
  try {
    const { room, temperature, time } = req.body;
    if (!room || !temperature || !time) {
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

    const [rows] = await db1.query(
      "SELECT email FROM user WHERE departement = 'QC"
    );
    const emailList = rows.map((row) => row.email);

    const mailOptions = {
      from: `"Monitoring QC" <${process.env.EMAIL_USER}>`,
      to: emailList.join(","), // gabungkan jadi string
      subject: `⚠️ Suhu Tinggi di ${room}`,
      html: `
        <p><strong>Waspada!</strong> Suhu di <strong>${room}</strong> melebihi batas normal.</p>
        <p>Suhu saat ini: <strong>${temperature}°C</strong></p>
        <p>Waktu: ${new Date(time).toLocaleString()}</p>
      `,
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
      const [results] = await db1.query(sql, values);
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
      const [data] = await db1.query(paginatedSql, paginatedValues);
      const [count] = await db1.query(countSql, values);

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
