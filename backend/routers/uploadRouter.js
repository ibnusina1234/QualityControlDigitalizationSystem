// backend/routes/uploadRoute.js
const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../controllers/uploadController"); // Import controller

const router = express.Router();

// Setup multer untuk menyimpan file sementara
const upload = multer({ dest: "uploads/" });

// Rute untuk upload gambar
router.post("/uploadToGdrive", upload.single("image"), uploadImage); // Menggunakan controller

module.exports = router;
