const moment = require("moment-timezone");
const jwt = require("jsonwebtoken");
const db = require("../database/db");

exports.searchUserLogs = async (req, res) => {
  const filters = req.query;
  let sql = "SELECT * FROM user_logs WHERE 1=1";
  const values = [];

  const allowedFilters = ["user_id", "activity", "ip_address", "user_agent"];
  Object.entries(filters).forEach(([key, value]) => {
    if (allowedFilters.includes(key)) {
      sql += ` AND ${key} = ?`;
      values.push(value);
    }
  });

  sql += " ORDER BY created_at DESC";

  try {
    const [results] = await db.query(sql, values);
    res.json(results);
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
