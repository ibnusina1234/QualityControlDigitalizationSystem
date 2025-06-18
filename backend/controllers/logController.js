const moment = require("moment-timezone");
const jwt = require("jsonwebtoken");
const db = require("../database/index");
const db1 = require("../database/db");

exports.searchUserLogs = async (req, res) => {
  const filters = req.query;
  let sql = "SELECT * FROM user_logs WHERE 1=1";
  const values = [];

  // Filter yang diperbolehkan
  const allowedFilters = ["user_id", "activity", "ip_address", "user_agent"];

  // Bangun query dinamis
  for (const [key, value] of Object.entries(filters)) {
    if (allowedFilters.includes(key) && value !== undefined && value !== "") {
      sql += ` AND ${key} = ?`;
      values.push(value);
    }
  }

  // Tambahkan urutan hasil
  sql += " ORDER BY created_at DESC";

  try {
    const [results] = await db.execute(sql, values);
    res.status(200).json(results);
  } catch (err) {
    console.error("Database query error:", err.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
};
