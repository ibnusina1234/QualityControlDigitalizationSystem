
const mysql = require('mysql2');
require("dotenv").config();

// Create a pool + promise
const pool = mysql.createPool({
  host: process.env.DB_HOST_TEKNIK,
  user: process.env.DB_USER_TEKNIK,
  password: process.env.DB_PASSWORD_TEKNIK,
  database: process.env.DB_NAME_TEKNIK,
  waitForConnections: true,
  connectionLimit: 10, // Bebas, 5-20 biasanya cukup
  queueLimit: 0,
}).promise(); // <== ini penting!

module.exports = pool;
