const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '../credentials.json'), 'utf8'));
const spreadsheetId = '1h51Y-3EWTHWDicrE1dqqJe2N296tUw8K2YGJGJbnyGY'; // Ganti dengan ID spreadsheet kamu

async function getBatchListFromSheet(materialName) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  // Ambil data baris 1-2000 kolom G, I, L, R
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!G2:R', // 
  });
  const rows = response.data.values || [];

  // Index relatif (0-based): G=0, I=2, L=5, R=11 dalam range G sampai R
  // (G H I J K L M N O P Q R)
  // 0 1 2 3 4 5 6 7 8 9 10 11

  // Filter dan mapping
  return rows
    .filter(row =>
      row[0] && // material name
      row[11] && // Raman
      row[2] && // No. Batch
      row[5] && // Jumlah Vat
      row[0].toLowerCase().includes(materialName.toLowerCase()) && // <-- partial match
      row[11].trim() === 'Pending'
    )
    .map(row => ({
      batch_number: row[2],
      vat_count: Number(row[5])
    }));
}

module.exports = { getBatchListFromSheet };