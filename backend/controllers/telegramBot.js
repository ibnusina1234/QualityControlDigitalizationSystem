const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // wajib di .env
const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // chat id default

// Fungsi kirim pesan ke Telegram
exports.sendTelegramMessage = async (req, res) => {
  const { message, chat_id } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const targetChatId = chat_id || DEFAULT_CHAT_ID;
  if (!targetChatId) return res.status(400).json({ error: "chat_id is required" });

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: targetChatId,
      text: message,
      parse_mode: "HTML"
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send Telegram message" });
  }
};