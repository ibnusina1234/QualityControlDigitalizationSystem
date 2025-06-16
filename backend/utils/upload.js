const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Konfigurasi lokasi penyimpanan file yang di-upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); // Menyimpan file di folder 'uploads'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Nama file unik
  },
});

// Validasi file yang diunggah (hanya gambar)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Hanya file gambar yang diizinkan
  } else {
    cb(new Error("Hanya file gambar yang diperbolehkan!"), false);
  }
};

// Membatasi ukuran file (contoh: 5MB per file)
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

// Membuat instance multer dengan konfigurasi di atas
const upload = multer({ storage, fileFilter, limits });

module.exports = upload;