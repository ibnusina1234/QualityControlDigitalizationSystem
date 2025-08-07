const {
  getBlockedStatus,
  unblockIdentifier,
  blockUser,
  isUserBlocked,
  addToWhitelist,
  removeFromWhitelist,
} = require("../middleware/rateLimit");
const logActivity = require("../helpers/logger"); // Pastikan logger menerima id

const rateLimitController = {
  // GET /admin/blocked-status - Mendapatkan status semua user yang diblok
  getBlockedStatus: async (req, res) => {
    try {
      const blockedData = getBlockedStatus();

      res.json({
        success: true,
        data: {
          blocked: blockedData,
          totalBlocked: Object.keys(blockedData).length,
        },
      });
    } catch (error) {
      console.error("Error getting blocked status:", error);
      res.status(500).json({
        success: false,
        error: "Gagal mengambil status blocked",
      });
    }
  },

  // POST /admin/block-user - Block user secara manual
  blockUser: async (req, res) => {
    try {
      const { userId, userEmail, duration, reason } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID diperlukan",
        });
      }

      // Default duration 30 menit jika tidak dispecify
      const blockDuration = duration || 30 * 60 * 1000;
      const blockReason = reason || "manual_block";

      // Block user
      blockUser(userId, blockReason, blockDuration);

      res.json({
        success: true,
        message: `User ${userEmail || userId} berhasil diblokir`,
        data: {
          userId,
          userEmail,
          blockedUntil: new Date(Date.now() + blockDuration).toISOString(),
          duration: blockDuration,
          reason: blockReason,
          blockedBy: req.user.id,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`Admin ${req.user.id} blocked user ${userId} (${userEmail})`);
      await logActivity(
        req.user?.id,
        `Block User ${userId} (${userEmail}) for ${blockDuration}ms Reason: ${blockReason}`,
        req
      );
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({
        success: false,
        error: "Gagal memblokir user",
      });
    }
  },

  // POST /admin/unblock-user - Unblock user
  unblockUser: async (req, res) => {
    try {
      const { identifier, userId, addToWhitelistTemp } = req.body;

      // Jika ada userId, format identifier
      const blockIdentifier = identifier || `user_${userId}`;

      if (!blockIdentifier) {
        return res.status(400).json({
          success: false,
          error: "Identifier atau User ID diperlukan",
        });
      }

      // Unblock user
      unblockIdentifier(blockIdentifier);

      // Optional: tambah ke whitelist sementara
      if (addToWhitelistTemp && userId) {
        addToWhitelist(userId.toString(), "user");
      }

      res.json({
        success: true,
        message: `Successfully unblocked: ${blockIdentifier}`,
        data: {
          identifier: blockIdentifier,
          unblockedBy: req.user.id,
          addedToWhitelist: addToWhitelistTemp || false,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`Admin ${req.user.id} unblocked ${blockIdentifier}`);
      await logActivity(
        req.user?.id,
        `Unblock User ${blockIdentifier} (addToWhitelist: ${!!addToWhitelistTemp})`,
        req
      );
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({
        success: false,
        error: "Gagal meng-unblock user",
      });
    }
  },

  // GET /admin/user-block-status/:userId - Detail status block user tertentu
  getUserBlockStatus: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID diperlukan",
        });
      }

      const blocked = isUserBlocked(userId);

      if (!blocked) {
        await logActivity(
          req.user?.id,
          `Check User Block Status: User ${userId} not blocked`,
          req
        );
        return res.json({
          success: true,
          data: {
            isBlocked: false,
            userId,
            message: "User tidak dalam status blocked",
          },
        });
      }

      // Ambil detail block
      const blockedData = getBlockedStatus();
      const key = `user_${userId}`;
      const blockInfo = blockedData[key];

      if (!blockInfo) {
        await logActivity(
          req.user?.id,
          `Check User Block Status: User ${userId} block expired`,
          req
        );
        return res.json({
          success: true,
          data: {
            isBlocked: false,
            userId,
            message: "Block sudah expired",
          },
        });
      }

      res.json({
        success: true,
        data: {
          isBlocked: true,
          userId,
          blockInfo: {
            ...blockInfo,
            resetTime: new Date(blockInfo.resetTime).toISOString(),
            blockedAt: blockInfo.blockedAt
              ? new Date(blockInfo.blockedAt).toISOString()
              : null,
            timeLeft: blockInfo.resetTime - Date.now(),
            timeLeftFormatted: formatTimeLeft(blockInfo.resetTime - Date.now()),
          },
        },
      });

      await logActivity(
        req.user?.id,
        `Check User Block Status: User ${userId} is blocked, info: ${JSON.stringify(
          blockInfo
        )}`,
        req
      );
    } catch (error) {
      console.error("Error getting user block status:", error);
      res.status(500).json({
        success: false,
        error: "Gagal mengambil status block user",
      });
    }
  },

  // PUT /admin/modify-block/:userId - Modify block duration
  modifyBlockDuration: async (req, res) => {
    try {
      const { userId } = req.params;
      const { duration, reason } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID diperlukan",
        });
      }

      if (!duration || duration < 0) {
        return res.status(400).json({
          success: false,
          error: "Duration harus berupa angka positif (dalam milliseconds)",
        });
      }

      const key = `user_${userId}`;
      const blockedData = getBlockedStatus();
      const existingBlock = blockedData[key];

      if (!existingBlock) {
        return res.status(404).json({
          success: false,
          error: "User tidak dalam status blocked",
        });
      }

      // Re-block dengan duration baru
      blockUser(userId, reason || existingBlock.type, duration);

      res.json({
        success: true,
        message: `Block duration untuk user ${userId} berhasil diubah`,
        data: {
          userId,
          newResetTime: new Date(Date.now() + duration).toISOString(),
          duration,
          reason: reason || existingBlock.type,
          modifiedBy: req.user.id,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(
        `Admin ${req.user.id} modified block duration for user ${userId}`
      );
      await logActivity(
        req.user?.id,
        `Modify Block Duration for User ${userId} to ${duration}ms Reason: ${
          reason || existingBlock.type
        }`,
        req
      );
    } catch (error) {
      console.error("Error modifying block duration:", error);
      res.status(500).json({
        success: false,
        error: "Gagal mengubah durasi block",
      });
    }
  },

  // POST /admin/unblock-all - Emergency unblock all
  unblockAll: async (req, res) => {
    try {
      const blockedData = getBlockedStatus();
      const beforeCount = Object.keys(blockedData).length;

      // Clear semua blocks
      Object.keys(blockedData).forEach((key) => {
        unblockIdentifier(key);
      });

      res.json({
        success: true,
        message: "All blocks cleared",
        data: {
          clearedCount: beforeCount,
          clearedBy: req.user.id,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(
        `Admin ${req.user.id} cleared all blocks (${beforeCount} entries)`
      );
      await logActivity(
        req.user?.id,
        `Unblock All (${beforeCount} entries)`,
        req
      );
    } catch (error) {
      console.error("Error clearing all blocks:", error);
      res.status(500).json({
        success: false,
        error: "Gagal menghapus semua blocks",
      });
    }
  },

  // POST /admin/whitelist - Manage whitelist
  manageWhitelist: async (req, res) => {
    try {
      const { identifier, type = "ip", action = "add" } = req.body;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          error: "Identifier diperlukan",
        });
      }

      if (!["add", "remove"].includes(action)) {
        return res.status(400).json({
          success: false,
          error: "Action harus add atau remove",
        });
      }

      if (!["ip", "user"].includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Type harus ip atau user",
        });
      }

      if (action === "add") {
        addToWhitelist(identifier, type);
      } else {
        removeFromWhitelist(identifier, type);
      }

      res.json({
        success: true,
        message: `${action === "add" ? "Added" : "Removed"} ${identifier} ${
          action === "add" ? "to" : "from"
        } ${type} whitelist`,
        data: {
          identifier,
          type,
          action,
          actionBy: req.user.id,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(
        `Admin ${req.user.id} ${action}ed ${identifier} ${
          action === "add" ? "to" : "from"
        } ${type} whitelist`
      );
      await logActivity(
        req.user?.id,
        `Whitelist ${action} ${identifier} ${type}`,
        req
      );
    } catch (error) {
      console.error("Error managing whitelist:", error);
      res.status(500).json({
        success: false,
        error: "Gagal mengelola whitelist",
      });
    }
  },
};

// Helper function untuk format time left
function formatTimeLeft(milliseconds) {
  if (milliseconds <= 0) return "Expired";

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari ${hours % 24} jam`;
  if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
  if (minutes > 0) return `${minutes} menit ${seconds % 60} detik`;
  return `${seconds} detik`;
}

module.exports = rateLimitController;
