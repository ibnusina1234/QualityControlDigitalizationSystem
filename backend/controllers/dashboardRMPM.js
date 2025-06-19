exports.getDashboardData = async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const data = await Promise.all(
      SHEETS.map(async (name) => {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${name}!A1:U3`, // Header + data nama + data batch
        });

        const values = result.data.values || [];
        const header = values[0] || [];
        const rowNama = values[1] || [];
        const rowBatch = values[2] || [];

        const sheetObj = {};

        header.forEach((col, index) => {
          const namaRaw = rowNama[index] || '';
          const batchRaw = rowBatch[index] || '';

          // Hilangkan prefix dan split jadi array
          const namaList = namaRaw.replace(/^namaMaterial:\s*/i, '').split(/\s*,\s*/);
          const batchList = batchRaw.replace(/^batch:\s*/i, '').replace(/;/g, ',').split(/\s*,\s*/);

          const combined = [];

          const maxLength = Math.max(namaList.length, batchList.length);

          for (let i = 0; i < maxLength; i++) {
            combined.push({
              nama: namaList[i] || null,
              batch: batchList[i] || null,
            });
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
