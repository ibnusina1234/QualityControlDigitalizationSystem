// routers/rateLimitRoutes.js
const express = require('express');
const router = express.Router();
const rateLimitController = require('../controllers/rateLimitController');
const { adminUnblockMiddleware } = require('../middleware/rateLimit');
const verifyToken = require('../middleware/auth');



// GET /admin/blocked-status - Mendapatkan status semua user yang diblok
router.get('/blocked-status',verifyToken, rateLimitController.getBlockedStatus);
      
// POST /admin/block-user - Block user secara manual
router.post('/block-user', verifyToken, rateLimitController.blockUser);

// POST /admin/unblock-user - Unblock user
router.post('/unblock-user', verifyToken,adminUnblockMiddleware, rateLimitController.unblockUser);

// GET /admin/user-block-status/:userId - Detail status block user tertentu
router.get('/user-block-status/:userId', verifyToken,adminUnblockMiddleware, rateLimitController.getUserBlockStatus);

// PUT /admin/modify-block/:userId - Modify block duration
router.put('/modify-block/:userId', verifyToken,adminUnblockMiddleware, rateLimitController.modifyBlockDuration);

// POST /admin/unblock-all - Emergency unblock all
router.post('/unblock-all', verifyToken,adminUnblockMiddleware, rateLimitController.unblockAll);

// POST /admin/whitelist - Manage whitelist
router.post('/whitelist', verifyToken,adminUnblockMiddleware,  rateLimitController.manageWhitelist);

module.exports = router;