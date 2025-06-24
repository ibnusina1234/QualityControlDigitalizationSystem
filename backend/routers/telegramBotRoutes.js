const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramBot');

router.post('/telegram/send', telegramController.sendTelegramMessage);

module.exports = router;