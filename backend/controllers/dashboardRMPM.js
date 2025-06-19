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
          range: `${name}!A1:U3`,
        });

        const values = result.data.values || [];
        const header = values[0] || [];
        const row1 = values[1] || [];
        const row2 = values[2] || [];

        let parsed = {};

        if (name.startsWith('total_sample')) {
          // === TOTAL SUMMARY ===
          parsed = {};
          header.forEach((h, i) => {
            parsed[h] = row1[i] || '';
          });
        } else {
          // === ARRAY OF { nama, batch } ===
          parsed = {};
          header.forEach((col, i) => {
            const namaRaw = row1[i] || '';
            const batchRaw = row2[i] || '';

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

            const combined = [];
            const max = Math.max(namaList.length, batchList.length);
            for (let j = 0; j < max; j++) {
              if (namaList[j] && batchList[j]) {
                combined.push({
                  nama: namaList[j],
                  batch: batchList[j],
                });
              }
            }

            parsed[col] = combined;
          });
        }

        return {
          name,
          data: parsed,
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
