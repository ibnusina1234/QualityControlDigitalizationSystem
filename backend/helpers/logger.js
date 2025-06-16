const db = require("../database/index");

const logActivity = (userId, activity, req) => {
  return new Promise((resolve, reject) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const sql = `
      INSERT INTO user_logs (user_id, activity, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [userId, activity, ip, userAgent], (err) => {
      if (err) {
        console.error("Gagal mencatat log:", err.message);
        return reject(err); // <-- reject Promise jika error
      }
      resolve(); // <-- resolve jika sukses
    });
  });
};

module.exports = logActivity;
