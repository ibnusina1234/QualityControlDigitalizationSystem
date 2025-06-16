// controllers/authController.js
const bcrypt = require("bcrypt");
const db = require("../database/dbForKS");
const logActivity = require("../helpers/logger"); // opsional

exports.verifyUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [results] = await db.query("SELECT * FROM user WHERE email = ?", [email]);

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const { password: _, ...userWithoutPassword } = user;

    console.log("✅ Verified user:", userWithoutPassword);

    if (logActivity) {
      logActivity(user.id, "Approval login confirmed", req);
    }

    res.json({
      message: "Login verified",
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("❌ Error in verifyUser:", err);
    res.status(500).json({
      error: "Internal server error",
      detail: err.message,
    });
  }
};
