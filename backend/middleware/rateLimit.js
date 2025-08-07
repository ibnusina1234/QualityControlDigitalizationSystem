// rateLimiter.js
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const verifyToken = require("./auth"); // Middleware untuk verifikasi token

// Store untuk menyimpan whitelist dan blocked IPs
const whitelistedIPs = new Set();
const whitelistedUsers = new Set();
const blockedStore = new Map(); // Menyimpan data yang diblokir

// Fungsi untuk menambah IP/User ke whitelist
const addToWhitelist = (identifier, type = "ip") => {
  if (type === "ip") {
    whitelistedIPs.add(identifier);
  } else if (type === "user") {
    whitelistedUsers.add(identifier);
  }
};

// Fungsi untuk menghapus dari whitelist
const removeFromWhitelist = (identifier, type = "ip") => {
  if (type === "ip") {
    whitelistedIPs.delete(identifier);
  } else if (type === "user") {
    whitelistedUsers.delete(identifier);
  }
};

// Fungsi untuk block user secara manual
const blockUser = (
  userId,
  reason = "manual_block",
  duration = 30 * 60 * 1000
) => {
  const key = `user_${userId}`;
  blockedStore.set(key, {
    count: 999,
    resetTime: Date.now() + duration,
    type: reason,
    blockedAt: Date.now(),
  });
  console.log(`Manually blocked user: ${userId} for ${duration}ms`);
};

// Fungsi untuk unblock manual
const unblockIdentifier = (identifier) => {
  blockedStore.delete(identifier);
  console.log(`Unblocked: ${identifier}`);
};

// Fungsi untuk mendapatkan status blocked
const getBlockedStatus = () => {
  const blocked = {};
  for (let [key, value] of blockedStore.entries()) {
    blocked[key] = {
      count: value.count,
      resetTime: value.resetTime,
      type: value.type,
      blockedAt: value.blockedAt,
    };
  }
  return blocked;
};

// Fungsi untuk cek apakah user diblok
const isUserBlocked = (userId) => {
  const key = `user_${userId}`;
  const blockData = blockedStore.get(key);

  if (!blockData) return false;

  // Cek apakah waktu block sudah expired
  if (Date.now() > blockData.resetTime) {
    blockedStore.delete(key);
    return false;
  }

  return true;
};

// Custom skip function untuk whitelist
const skipWhitelisted = (req) => {
  const ip = req.ip;

  if (whitelistedIPs.has(ip)) return true;

  const user = req.user;
  if (user && whitelistedUsers.has(user.id.toString())) return true;

  return false;
};

// Custom skip function untuk user yang diblok manual
const skipBlocked = (req) => {
  const user = req.user;
  if (user && isUserBlocked(user.id)) {
    return false;
  }

  return skipWhitelisted(req);
};

const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 5,
  message: {
    error: "Terlalu banyak percobaan login. Silakan coba lagi setelah 5 menit.",
    retryAfter: 5 * 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhitelisted,
  // Handler ketika limit tercapai - mengganti onLimitReached yang deprecated
  handler: (req, res, next, options) => {
    const key = req.ip;
    blockedStore.set(key, {
      count: options.max,
      resetTime: Date.now() + options.windowMs,
      type: "login",
      blockedAt: Date.now(),
    });
    console.log(`Login rate limit reached for IP: ${key}`);

    // Return error response
    return res.status(429).json({
      error:
        "Terlalu banyak percobaan login. Silakan coba lagi setelah 5 menit.",
      retryAfter: 5 * 60 * 1000,
    });
  },
});

const dynamicRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit

  max: (req, res) => {
    const user = req.user;
    if (!user) return 50;

    if (isUserBlocked(user.id)) return 0;

    if (user.userrole === "admin") return 1000;
    if (user.userrole === "user") return 200;

    return 100;
  },

  keyGenerator: (req) => {
    const user = req.user;
    return user ? `user_${user.id}` : `ip_${req.ip}`;
  },

  message: (req) => {
    const user = req.user;

    if (user && isUserBlocked(user.id)) {
      const blockData = blockedStore.get(`user_${user.id}`);
      const resetTime = new Date(blockData.resetTime);
      return {
        error: "Akun Anda telah diblokir oleh administrator.",
        blockedUntil: resetTime.toISOString(),
        reason: blockData.type || "unknown",
      };
    }

    return {
      error: "Terlalu banyak permintaan, coba lagi nanti.",
      retryAfter: 10 * 60 * 1000,
    };
  },

  skip: (req) => {
    const user = req.user;
    if (user && isUserBlocked(user.id)) return false;

    // implementasi skipWhitelisted (opsional, jika kamu punya)
    // return skipWhitelisted(req);
    return false;
  },

  handler: (req, res, next, options) => {
    const key = options.keyGenerator(req);

    // Cegah overwrite blokir manual
    const existingBlock = blockedStore.get(key);
    if (!existingBlock || existingBlock.type !== "manual_block") {
      blockedStore.set(key, {
        count:
          typeof options.max === "function"
            ? options.max(req, res)
            : options.max,
        resetTime: Date.now() + options.windowMs,
        type: "api",
        blockedAt: Date.now(),
      });
    }

    console.warn(`🔒 Rate limit triggered for ${key}`);

    const message =
      typeof options.message === "function"
        ? options.message(req)
        : options.message;
    return res.status(429).json(message);
  },
});

// Middleware untuk admin unblock
const adminUnblockMiddleware = (req, res, next) => {
  const user = req.user;

  if (!user || (user.userrole !== "admin" && user.userrole !== "super admin")) {
    return res
      .status(403)
      .json({ error: "Hanya admin yang dapat melakukan operasi ini" });
  }

  req.user = user;
  next();
};

// Routes untuk management
const createManagementRoutes = (app) => {
  // Endpoint untuk block user
  app.post("/admin/block-user", adminUnblockMiddleware, (req, res) => {
    const { userId, userEmail, reason = "manual_block", duration } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "User ID diperlukan",
        success: false,
      });
    }

    // Default duration 30 menit untuk manual block
    const blockDuration = duration || 30 * 60 * 1000;

    // Block user
    blockUser(userId, reason, blockDuration);

    res.json({
      success: true,
      message: `User ${userEmail || userId} berhasil diblokir`,
      data: {
        blockedUntil: new Date(Date.now() + blockDuration).toISOString(),
        duration: blockDuration,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(
      `Admin ${req.user.email} blocked user ${userId} (${userEmail})`
    );
  });

  // Endpoint untuk unblock user
  app.post("/admin/unblock-user", adminUnblockMiddleware, (req, res) => {
    const { userId, addToWhitelistTemp = false } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "User ID diperlukan",
        success: false,
      });
    }

    const identifier = `user_${userId}`;

    // Unblock dari rate limiter store
    unblockIdentifier(identifier);

    // Jika ingin menambahkan ke whitelist sementara
    if (addToWhitelistTemp) {
      addToWhitelist(userId.toString(), "user");
    }

    res.json({
      success: true,
      message: `User ${userId} berhasil di-unblock`,
      data: {
        unblocked: identifier,
        addedToWhitelist: addToWhitelistTemp,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Admin ${req.user.email} unblocked user ${userId}`);
  });

  // Endpoint untuk unblock IP atau identifier lainnya
  app.post("/admin/unblock", adminUnblockMiddleware, (req, res) => {
    const { identifier, type } = req.body;

    if (!identifier) {
      return res.status(400).json({
        error: "Identifier diperlukan",
        success: false,
      });
    }

    // Unblock dari rate limiter store
    unblockIdentifier(identifier);

    // Jika ingin menambahkan ke whitelist sementara
    if (type === "whitelist") {
      const identifierType = identifier.startsWith("user_") ? "user" : "ip";
      const cleanId = identifier.replace(/^(user_|ip_)/, "");
      addToWhitelist(cleanId, identifierType);
    }

    res.json({
      success: true,
      message: `Successfully unblocked: ${identifier}`,
      data: {
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Admin ${req.user.email} unblocked ${identifier}`);
  });

  // Endpoint untuk melihat status blocked
  app.get("/admin/blocked-status", adminUnblockMiddleware, (req, res) => {
    res.json({
      success: true,
      data: {
        blocked: getBlockedStatus(),
        whitelisted: {
          ips: Array.from(whitelistedIPs),
          users: Array.from(whitelistedUsers),
        },
      },
    });
  });

  // Endpoint untuk menambah/hapus whitelist
  app.post("/admin/whitelist", adminUnblockMiddleware, (req, res) => {
    const { identifier, type = "ip", action = "add" } = req.body;

    if (!identifier) {
      return res.status(400).json({
        error: "Identifier diperlukan",
        success: false,
      });
    }

    if (action === "add") {
      addToWhitelist(identifier, type);
      res.json({
        success: true,
        message: `Added ${identifier} to ${type} whitelist`,
      });
    } else if (action === "remove") {
      removeFromWhitelist(identifier, type);
      res.json({
        success: true,
        message: `Removed ${identifier} from ${type} whitelist`,
      });
    } else {
      res.status(400).json({
        error: "Action harus add atau remove",
        success: false,
      });
    }

    console.log(
      `Admin ${req.user.email} ${action}ed ${identifier} ${
        action === "add" ? "to" : "from"
      } ${type} whitelist`
    );
  });

  // Endpoint untuk emergency unblock all
  app.post("/admin/unblock-all", adminUnblockMiddleware, (req, res) => {
    const beforeCount = blockedStore.size;
    blockedStore.clear();
    res.json({
      success: true,
      message: "All blocks cleared",
      data: {
        clearedCount: beforeCount,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(
      `Admin ${req.user.email} cleared all blocks (${beforeCount} entries)`
    );
  });

  // Endpoint untuk mendapatkan detail block user tertentu
  app.get(
    "/admin/user-block-status/:userId",
    adminUnblockMiddleware,
    (req, res) => {
      const { userId } = req.params;
      const key = `user_${userId}`;
      const blockData = blockedStore.get(key);

      if (!blockData) {
        return res.json({
          success: true,
          data: {
            isBlocked: false,
            message: "User tidak dalam status blocked",
          },
        });
      }

      // Cek apakah expired
      if (Date.now() > blockData.resetTime) {
        blockedStore.delete(key);
        return res.json({
          success: true,
          data: {
            isBlocked: false,
            message: "Block sudah expired dan telah dihapus",
          },
        });
      }

      res.json({
        success: true,
        data: {
          isBlocked: true,
          blockData: {
            ...blockData,
            timeLeft: blockData.resetTime - Date.now(),
            resetTime: new Date(blockData.resetTime).toISOString(),
            blockedAt: new Date(blockData.blockedAt).toISOString(),
          },
        },
      });
    }
  );

  // Endpoint untuk modify block duration
  app.put("/admin/modify-block/:userId", adminUnblockMiddleware, (req, res) => {
    const { userId } = req.params;
    const { duration, reason } = req.body;

    if (!duration || duration < 0) {
      return res.status(400).json({
        error: "Duration harus berupa angka positif (dalam milliseconds)",
        success: false,
      });
    }

    const key = `user_${userId}`;
    const existingBlock = blockedStore.get(key);

    if (!existingBlock) {
      return res.status(404).json({
        error: "User tidak dalam status blocked",
        success: false,
      });
    }

    // Update block duration
    blockedStore.set(key, {
      ...existingBlock,
      resetTime: Date.now() + duration,
      type: reason || existingBlock.type,
      modifiedAt: Date.now(),
      modifiedBy: req.user.email,
    });

    res.json({
      success: true,
      message: `Block duration untuk user ${userId} berhasil diubah`,
      data: {
        newResetTime: new Date(Date.now() + duration).toISOString(),
        duration: duration,
      },
    });

    console.log(
      `Admin ${req.user.email} modified block duration for user ${userId}`
    );
  });
};

// Auto cleanup expired blocks
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  for (let [key, value] of blockedStore.entries()) {
    if (now > value.resetTime) {
      blockedStore.delete(key);
      cleanedCount++;
      console.log(`Auto-unblocked expired: ${key}`);
    }
  }

  if (cleanedCount > 0) {
    console.log(`Auto-cleanup: removed ${cleanedCount} expired blocks`);
  }
}, 60000); // Check setiap menit

// Periodic log untuk monitoring
setInterval(() => {
  const blockedCount = blockedStore.size;
  const whitelistedIPCount = whitelistedIPs.size;
  const whitelistedUserCount = whitelistedUsers.size;

  if (blockedCount > 0 || whitelistedIPCount > 0 || whitelistedUserCount > 0) {
    console.log(
      `Rate Limiter Status - Blocked: ${blockedCount}, Whitelisted IPs: ${whitelistedIPCount}, Whitelisted Users: ${whitelistedUserCount}`
    );
  }
}, 5 * 60 * 1000); // Log setiap 5 menit

module.exports = {
  loginRateLimiter,
  dynamicRateLimiter,
  adminUnblockMiddleware,
  createManagementRoutes,
  addToWhitelist,
  removeFromWhitelist,
  unblockIdentifier,
  getBlockedStatus,
  blockUser,
  isUserBlocked,
};
