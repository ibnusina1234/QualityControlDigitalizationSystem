const { google } = require("googleapis");

const getDriveFileStream = async (fileId, auth) => {
      const drive = google.drive({ version: "v3", auth });
    
      try {
        // Mengambil metadata file untuk mendapatkan mimeType
        const fileMetadata = await drive.files.get({
          fileId,
          fields: 'mimeType', // Hanya mengambil mimeType
        });
    
        const mimeType = fileMetadata.data.mimeType;
    
        // Mengambil file dalam bentuk stream
        const fileStream = await drive.files.get({
          fileId,
          alt: 'media', // Mengambil file dalam bentuk stream
        }, { responseType: 'stream' });
    
        return { stream: fileStream.data, mimeType };
      } catch (error) {
        console.error("Error getting file stream from Google Drive:", error);
        throw new Error("Failed to retrieve file stream from Google Drive.");
      }
    };
    
    module.exports = { getDriveFileStream };
