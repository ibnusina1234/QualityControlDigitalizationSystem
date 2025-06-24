const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
// Pisahkan string dengan koma menjadi array
const DEFAULT_CHAT_IDS = process.env.TELEGRAM_CHAT_ID
  ? process.env.TELEGRAM_CHAT_ID.split(',').map(id => id.trim())
  : [];

exports.sendTelegramMessage = async (req, res) => {
  const { message, chat_id } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  // Gunakan chat_id dari body jika disediakan, jika tidak pakai default
  const targetChatIds = chat_id
    ? Array.isArray(chat_id) ? chat_id : [chat_id]
    : DEFAULT_CHAT_IDS;

  if (!targetChatIds.length)
    return res.status(400).json({ error: "No chat_id provided" });

  try {
    // Kirim ke semua chat ID
    const promises = targetChatIds.map(id =>
      axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: id,
        text: message,
        parse_mode: "HTML"
      })
    );

    await Promise.all(promises);

    res.json({ success: true, sent_to: targetChatIds });
  } catch (err) {
    console.error("Telegram error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to send Telegram message" });
  }
};
