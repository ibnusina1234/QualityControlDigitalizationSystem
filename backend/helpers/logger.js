const db = require("../database/db");

const logActivity = async (userId, activity, req) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const sql = `
      INSERT INTO user_logs (user_id, activity, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `;

    await db.execute(sql, [userId, activity, ip, userAgent]);

  } catch (err) {
    console.error("Gagal mencatat log:", err.message);
    // Kalau kamu ingin melempar lagi, bisa gunakan:
    // throw err;
  }
};

module.exports = logActivity;
