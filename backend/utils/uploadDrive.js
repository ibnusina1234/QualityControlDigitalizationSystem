const fs = require("fs");
require("dotenv").config();
const path = require("path");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../credentials.json"),
  scopes: SCOPES,
});
const drive = google.drive({ version: "v3", auth });

const uploadToDrive = async (file, photoCategory = "Unknown") => {
  if (!file) {
    console.error("❌ File input tidak ditemukan.");
    throw new Error("Tidak ada file untuk di-upload.");
  }

  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const customFileName = `${photoCategory}_${timestamp}${path.extname(file.originalname)}`;

    const fileMetadata = {
      name: customFileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    });

    // Hapus file lokal setelah upload
    try {
      await fs.promises.unlink(file.path);
    } catch (unlinkError) {
      console.error("Gagal menghapus file lokal:", unlinkError.message);
    }

    return {
      id: response.data.id,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      fileName: customFileName,
    };

  } catch (err) {
    console.error("❌ Gagal upload file:", file.originalname, err.message);
    throw new Error("Gagal upload file ke Google Drive.");
  }
};

module.exports = uploadToDrive;
