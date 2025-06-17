const express = require("express");
const router = express.Router();
const dashboardController = require('../controllers/dashboardRMPM');
const {dynamicRateLimiter} = require("../middleware/rateLimit");
const verifyToken = require("../middleware/auth");

router.get('/dashboardRMPM-data',dynamicRateLimiter,dashboardController.getDashboardData);

module.exports = router;