const { google } = require("googleapis");
const path = require("path");
const key = require("../utils/credentials"); // ganti path sesuai lokasi key-mu

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

const deleteDriveFile = async (fileId) => {
  try {
    await drive.files.delete({ fileId });
    console.log(`🗑️ File di Google Drive (${fileId}) berhasil dihapus.`);
  } catch (err) {
    console.error(`❌ Gagal hapus file di Google Drive (${fileId}):`, err.message);
  }
};

module.exports = {
  deleteDriveFile,
};
