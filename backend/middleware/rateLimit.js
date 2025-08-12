// rateLimiter.js - FIXED VERSION WITH CORRECT EXPORTS
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

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

// FIXED: Consistent key generation untuk semua scenario
const generateBlockKey = (req, type = "auto") => {
  if (type === "user" && req.user) {
    return `user_${req.user.id}`;
  } else if (type === "ip") {
    return `ip_${req.ip}`;
  } else if (type === "login") {
    // Login bisa dari IP atau user yang sudah dikenal
    return req.user ? `user_${req.user.id}` : `ip_${req.ip}`;
  } else if (type === "auto") {
    // Auto-detect: prioritas user, fallback ke IP
    return req.user ? `user_${req.user.id}` : `ip_${req.ip}`;
  }
  return `ip_${req.ip}`; // fallback
};

// Fungsi untuk block user secara manual
const blockUser = (userId, reason = "manual_block", duration = 30 * 60 * 1000) => {
  const key = `user_${userId}`;
  blockedStore.set(key, {
    count: 999,
    resetTime: Date.now() + duration,
    type: reason,
    blockedAt: Date.now(),
    userId: userId,
    manual: true // Flag untuk manual block
  });
  console.log(`🔒 Manually blocked user: ${userId} with key: ${key} for ${duration}ms`);
};

// Fungsi untuk unblock manual
const unblockIdentifier = (identifier) => {
  const deleted = blockedStore.delete(identifier);
  console.log(`🔓 Unblocked: ${identifier} (${deleted ? 'success' : 'not found'})`);
  return deleted;
};

// ENHANCED: getBlockedStatus dengan auto-cleanup
const getBlockedStatus = () => {
  const blocked = {};
  const now = Date.now();
  
  for (let [key, value] of blockedStore.entries()) {
    // Auto-clean expired blocks
    if (now > value.resetTime) {
      blockedStore.delete(key);
      console.log(`🧹 Auto-cleaned expired block: ${key}`);
      continue;
    }
    
    blocked[key] = {
      count: value.count,
      resetTime: value.resetTime,
      type: value.type,
      blockedAt: value.blockedAt,
      userId: value.userId || (key.startsWith('user_') ? key.replace('user_', '') : null),
      timeLeft: value.resetTime - now,
      manual: value.manual || false,
      ip: value.ip || null
    };
  }
  
  console.log(`📊 getBlockedStatus: ${Object.keys(blocked).length} active blocks`);
  return blocked;
};

// FIXED: isUserBlocked dengan cleanup otomatis
const isUserBlocked = (userId) => {
  const key = `user_${userId}`;
  const blockData = blockedStore.get(key);

  if (!blockData) return false;

  // Cek apakah waktu block sudah expired
  if (Date.now() > blockData.resetTime) {
    blockedStore.delete(key);
    console.log(`🔓 Auto-unblocked expired user: ${userId}`);
    return false;
  }

  return true;
};

// ENHANCED: Check if IP is blocked
const isIPBlocked = (ip) => {
  const key = `ip_${ip}`;
  const blockData = blockedStore.get(key);

  if (!blockData) return false;

  if (Date.now() > blockData.resetTime) {
    blockedStore.delete(key);
    console.log(`🔓 Auto-unblocked expired IP: ${ip}`);
    return false;
  }

  return true;
};

// ENHANCED: Check if request is blocked (user or IP)
const isRequestBlocked = (req) => {
  // Prioritas: cek user block dulu, kemudian IP block
  if (req.user && isUserBlocked(req.user.id)) {
    return { blocked: true, type: 'user', key: `user_${req.user.id}` };
  }
  
  if (isIPBlocked(req.ip)) {
    return { blocked: true, type: 'ip', key: `ip_${req.ip}` };
  }
  
  return { blocked: false };
};

// Custom skip function untuk whitelist
const skipWhitelisted = (req) => {
  const ip = req.ip;
  if (whitelistedIPs.has(ip)) return true;

  const user = req.user;
  if (user && whitelistedUsers.has(user.id.toString())) return true;

  return false;
};

// CRITICAL: Block Check Middleware - HARUS DITERAPKAN DI SEMUA ROUTES
const blockCheckMiddleware = (req, res, next) => {
  // Skip whitelist
  if (skipWhitelisted(req)) {
    return next();
  }

  // Cek apakah request diblok
  const blockStatus = isRequestBlocked(req);
  
  if (blockStatus.blocked) {
    const blockData = blockedStore.get(blockStatus.key);
    const resetTime = new Date(blockData.resetTime);
    
    console.log(`🚫 Blocked request: ${blockStatus.type} - ${blockStatus.key}`);
    
    return res.status(429).json({
      error: blockStatus.type === 'user' 
        ? "Akun Anda telah diblokir oleh administrator." 
        : "IP Anda telah diblokir sementara.",
      blocked: true,
      type: blockStatus.type,
      blockedUntil: resetTime.toISOString(),
      reason: blockData.type || "unknown",
      timeLeft: blockData.resetTime - Date.now()
    });
  }

  next();
};

// FIXED: Login Rate Limiter dengan user-centric approach
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
  
  keyGenerator: (req) => {
    // FIXED: Gunakan email atau IP untuk login attempts
    const email = req.body?.email;
    return email ? `login_${email}` : `ip_${req.ip}`;
  },
  
  handler: (req, res, next, options) => {
    const email = req.body?.email;
    const key = email ? `login_${email}` : `ip_${req.ip}`;
    
    // FIXED: Store dengan format yang konsisten
    blockedStore.set(key, {
      count: options.max,
      resetTime: Date.now() + options.windowMs,
      type: "login_rate_limit",
      blockedAt: Date.now(),
      ip: req.ip,
      email: email
    });
    
    console.log(`🚫 Login rate limit reached for key: ${key}`);

    return res.status(429).json({
      error: "Terlalu banyak percobaan login. Silakan coba lagi setelah 5 menit.",
      retryAfter: 5 * 60 * 1000,
    });
  },
});

// FIXED: Dynamic Rate Limiter dengan improved logic
const dynamicRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit

  max: (req, res) => {
    const user = req.user;
    if (!user) return 50;

    // CRITICAL: Return 0 jika user diblok manual
    if (isUserBlocked(user.id)) return 0;

    if (user.userrole === "super admin") return 2000;
    if (user.userrole === "admin") return 1000;
    if (user.userrole === "user") return 200;

    return 100;
  },

  keyGenerator: (req) => {
    return generateBlockKey(req, "auto");
  },

  message: (req) => {
    const user = req.user;

    if (user && isUserBlocked(user.id)) {
      const blockData = blockedStore.get(`user_${user.id}`);
      const resetTime = new Date(blockData.resetTime);
      return {
        error: "Akun Anda telah diblokir oleh administrator.",
        blocked: true,
        blockedUntil: resetTime.toISOString(),
        reason: blockData.type || "unknown",
        timeLeft: blockData.resetTime - Date.now()
      };
    }

    return {
      error: "Terlalu banyak permintaan, coba lagi nanti.",
      retryAfter: 10 * 60 * 1000,
    };
  },

  skip: (req) => {
    // Skip whitelist tapi TIDAK skip blocked users (akan handle di message)
    return skipWhitelisted(req);
  },

  handler: (req, res, next, options) => {
    const key = options.keyGenerator(req);
    const user = req.user;

    // FIXED: Jangan overwrite manual blocks
    const existingBlock = blockedStore.get(key);
    if (existingBlock && existingBlock.manual) {
      console.log(`⚠️ Preserving manual block for ${key}`);
    } else {
      blockedStore.set(key, {
        count: typeof options.max === "function" ? options.max(req, res) : options.max,
        resetTime: Date.now() + options.windowMs,
        type: "api_rate_limit",
        blockedAt: Date.now(),
        userId: user ? user.id : null,
        ip: req.ip,
        manual: false
      });
      
      console.log(`🔒 API rate limit triggered for ${key} (User: ${user ? user.id : 'anonymous'})`);
    }

    const message = typeof options.message === "function" ? options.message(req) : options.message;
    return res.status(429).json(message);
  },
});

// Middleware untuk admin unblock
const adminUnblockMiddleware = (req, res, next) => {
  const user = req.user;

  if (!user || (user.userrole !== "admin" && user.userrole !== "super admin")) {
    return res.status(403).json({ 
      error: "Hanya admin yang dapat melakukan operasi ini" 
    });
  }

  req.user = user;
  next();
};

// ENHANCED: Management routes
const createManagementRoutes = (app) => {
  // Enhanced blocked status endpoint
  app.get("/admin/blocked-status", adminUnblockMiddleware, (req, res) => {
    const blockedData = getBlockedStatus();
    
    // Categorize blocks
    const userBlocks = {};
    const ipBlocks = {};
    const loginBlocks = {};
    
    Object.entries(blockedData).forEach(([key, data]) => {
      if (key.startsWith('user_')) {
        userBlocks[key] = data;
      } else if (key.startsWith('ip_')) {
        ipBlocks[key] = data;
      } else if (key.startsWith('login_')) {
        loginBlocks[key] = data;
      }
    });
    
    res.json({
      success: true,
      data: {
        blocked: blockedData,
        userBlocks: userBlocks,
        ipBlocks: ipBlocks,
        loginBlocks: loginBlocks,
        totalBlocked: Object.keys(blockedData).length,
        whitelisted: {
          ips: Array.from(whitelistedIPs),
          users: Array.from(whitelistedUsers),
        },
        debug: {
          timestamp: new Date().toISOString(),
          activeKeys: Object.keys(blockedData)
        }
      },
    });
    
    console.log(`📊 Admin ${req.user.email} requested blocked status: ${Object.keys(blockedData).length} blocks`);
  });

  // Block user endpoint
  app.post("/admin/block-user", adminUnblockMiddleware, (req, res) => {
    const { userId, userEmail, reason = "manual_block", duration } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "User ID diperlukan",
        success: false,
      });
    }

    const blockDuration = duration || 30 * 60 * 1000;
    
    blockUser(userId, reason, blockDuration);

    res.json({
      success: true,
      message: `User ${userEmail || userId} berhasil diblokir`,
      data: {
        blockedUntil: new Date(Date.now() + blockDuration).toISOString(),
        duration: blockDuration,
        timestamp: new Date().toISOString(),
        blockedBy: req.user.email
      },
    });

    console.log(`👤 Admin ${req.user.email} manually blocked user ${userId} (${userEmail})`);
  });

  // Enhanced unblock endpoint
  app.post("/admin/unblock-user", adminUnblockMiddleware, (req, res) => {
    const { userId, identifier, addToWhitelistTemp = false } = req.body;

    const targetKey = identifier || `user_${userId}`;

    if (!targetKey) {
      return res.status(400).json({
        error: "User ID atau identifier diperlukan",
        success: false,
      });
    }

    const unblocked = unblockIdentifier(targetKey);

    if (addToWhitelistTemp && userId) {
      addToWhitelist(userId.toString(), "user");
    }

    res.json({
      success: true,
      message: `Successfully unblocked: ${targetKey}`,
      data: {
        unblocked: targetKey,
        found: unblocked,
        addedToWhitelist: addToWhitelistTemp,
        timestamp: new Date().toISOString(),
        unblockedBy: req.user.email
      },
    });

    console.log(`🔓 Admin ${req.user.email} unblocked ${targetKey}`);
  });

  // Emergency unblock all
  app.post("/admin/unblock-all", adminUnblockMiddleware, (req, res) => {
    const beforeCount = blockedStore.size;
    const keys = Array.from(blockedStore.keys());
    
    blockedStore.clear();
    
    res.json({
      success: true,
      message: "All blocks cleared",
      data: {
        clearedCount: beforeCount,
        clearedKeys: keys,
        timestamp: new Date().toISOString(),
        clearedBy: req.user.email
      },
    });

    console.log(`🧹 Admin ${req.user.email} cleared all blocks (${beforeCount} entries): ${keys.join(', ')}`);
  });

  // Get specific user block status
  app.get("/admin/user-block-status/:userId", adminUnblockMiddleware, (req, res) => {
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
  });
};

// Auto cleanup expired blocks
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  const cleanedKeys = [];

  for (let [key, value] of blockedStore.entries()) {
    if (now > value.resetTime) {
      blockedStore.delete(key);
      cleanedCount++;
      cleanedKeys.push(key);
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Auto-cleanup: removed ${cleanedCount} expired blocks: ${cleanedKeys.join(', ')}`);
  }
}, 60000); // Check setiap menit

// Monitoring
setInterval(() => {
  const blockedCount = blockedStore.size;
  
  if (blockedCount > 0) {
    const blockTypes = {};
    const userBlocks = [];
    const ipBlocks = [];
    const loginBlocks = [];
    
    for (let [key, value] of blockedStore.entries()) {
      blockTypes[value.type] = (blockTypes[value.type] || 0) + 1;
      
      if (key.startsWith('user_')) {
        userBlocks.push(key);
      } else if (key.startsWith('ip_')) {
        ipBlocks.push(key);
      } else if (key.startsWith('login_')) {
        loginBlocks.push(key);
      }
    }
    
    console.log(`📊 Rate Limiter Status:`, {
      totalBlocked: blockedCount,
      userBlocks: userBlocks.length,
      ipBlocks: ipBlocks.length,
      loginBlocks: loginBlocks.length,
      types: blockTypes,
      whitelistedIPs: whitelistedIPs.size,
      whitelistedUsers: whitelistedUsers.size
    });
  }
}, 5 * 60 * 1000); // Log setiap 5 menit

// CRITICAL FIX: Export semua fungsi yang dibutuhkan dengan nama yang tepat
module.exports = {
  // Rate limiter middleware
  loginRateLimiter,
  dynamicRateLimiter,
  
  // Middleware functions
  blockCheckMiddleware, // CRITICAL: Ini yang diperlukan server.js
  adminUnblockMiddleware,
  
  // Management functions
  createManagementRoutes,
  addToWhitelist,
  removeFromWhitelist,
  unblockIdentifier,
  getBlockedStatus,
  blockUser,
  
  // Check functions
  isUserBlocked,
  isIPBlocked,
  isRequestBlocked,
  generateBlockKey,
  
  // Helper functions untuk backward compatibility
  skipWhitelisted
};