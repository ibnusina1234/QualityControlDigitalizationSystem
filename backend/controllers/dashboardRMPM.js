const { google } = require('googleapis');
const path = require('path');

const SERVICE_ACCOUNT_FILE = path.resolve(__dirname, '../', '../', 'key', 'credentials.json');
const SPREADSHEET_ID = '1n-bisi0QRv2m8MZhYUhVjW3Fb5q8iWvfaSarVaMDs2g';
const SHEETS = [
  'total_sample_qc',
  'total_sample_qc_rm',
  'total_sample_qc_pm',
  'daftar_kedatangan',
  'daftar_pendingan_pm',
  'daftar_pendingan_rm'
];

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

exports.getDashboardData = async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const data = await Promise.all(
      SHEETS.map(async (name) => {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${name}!A1:U3`, // Ambil header + 2 baris data
        });

        const values = result.data.values || [];
        const header = values[0] || [];
        const rowNama = values[1] || [];
        const rowBatch = values[2] || [];

        const sheetObj = {};

        header.forEach((col, index) => {
          const namaRaw = rowNama[index] || '';
          const batchRaw = rowBatch[index] || '';

          // Bersihkan dan pisahkan jadi array
          const namaList = namaRaw
            .replace(/^namaMaterial:\s*/i, '')
            .split(/\s*,\s*/)
            .map((v) => v.trim())
            .filter(Boolean);

          const batchList = batchRaw
            .replace(/^batch:\s*/i, '')
            .replace(/;/g, ',')
            .split(/\s*,\s*/)
            .map((v) => v.trim())
            .filter(Boolean);

          // Gabungkan berdasarkan urutan (hanya jika ada pasangan nama+batch)
          const combined = [];
          const maxLength = Math.max(namaList.length, batchList.length);
          for (let i = 0; i < maxLength; i++) {
            if (namaList[i] && batchList[i]) {
              combined.push({
                nama: namaList[i],
                batch: batchList[i],
              });
            }
          }

          sheetObj[col] = combined;
        });

        return {
          name,
          data: sheetObj,
        };
      })
    );

    const combined = {};
    data.forEach((sheet) => {
      combined[sheet.name] = sheet.data;
    });

    res.json(combined);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch spreadsheet data' });
  }
};
