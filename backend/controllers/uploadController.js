// backend/controllers/uploadController.js
const fs = require("fs");
const { google } = require("googleapis");
const path = require("path");

// Setup OAuth Google Drive
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../credentials.json"), // Pastikan path benar
  scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

// Fungsi upload ke Google Drive
const uploadToDrive = async (file) => {
  const fileMetadata = {
    name: file.originalname,
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, webViewLink, webContentLink",
  });

  // Hapus file lokal setelah upload
  fs.unlinkSync(file.path);

  return response.data;
};

// Controller untuk menangani request upload
const uploadImage = async (req, res) => {
  try {
    const result = await uploadToDrive(req.file);
    res.json({
      success: true,
      fileId: result.id,
      viewLink: result.webViewLink,
      downloadLink: result.webContentLink,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Upload gagal" });
  }
};

module.exports = { uploadImage };
