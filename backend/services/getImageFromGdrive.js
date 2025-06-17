const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const { getDriveFileStream } = require("../utils/getImageFromGdrive");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
 keyFile: path.join(__dirname, "../key/credentials.json"),
  scopes: SCOPES,
});

exports.getFileStreamFromDrive = async (fileId) => {
      try {
        const { stream, mimeType } = await getDriveFileStream(fileId, auth);
        return { stream, mimeType };
      } catch (error) {
        console.error("Error getting file stream from Google Drive:", error);
        throw new Error("Failed to retrieve file stream from Google Drive.");
      }
    };