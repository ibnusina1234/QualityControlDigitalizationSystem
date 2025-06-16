// db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Buat koneksi pool
const db = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER ,
  password: process.env.DB_PASS ,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Tes koneksi saat startup
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('[DB] MySQL Pool Connected Successfully');
    connection.release();
  } catch (error) {
    console.error('[DB] MySQL Pool Connection Error:', error.message);
    process.exit(1); // Exit server jika gagal konek DB
  }
})();

module.exports = db;
