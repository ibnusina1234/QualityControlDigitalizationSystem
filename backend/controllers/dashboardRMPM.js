const { google } = require('googleapis');
const path = require('path');

const SERVICE_ACCOUNT_FILE = path.resolve(__dirname, '../', '../', 'key', 'credentials.json');// Pastikan path benar
const SPREADSHEET_ID = '1n-bisi0QRv2m8MZhYUhVjW3Fb5q8iWvfaSarVaMDs2g';
const SHEETS = ['total_sample_qc', 'total_sample_qc_rm', 'total_sample_qc_pm'];

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

exports.getDashboardData = async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Ambil data dari ketiga sheet
    const data = await Promise.all(
      SHEETS.map(async (name) => {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${name}!A1:I2`, // Ambil header dan baris data
        });
        const values = result.data.values || [];
        return {
          name,
          header: values[0] || [],
          data: values[1] || [],
        };
      })
    );

    // Gabungkan menjadi satu JSON
    const combined = {};
    data.forEach((sheet) => {
      const obj = {};
      sheet.header.forEach((h, i) => {
        obj[h] = sheet.data[i] || null;
      });
      combined[sheet.name] = obj;
    });

    res.json(combined);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch spreadsheet data' });
  }
};