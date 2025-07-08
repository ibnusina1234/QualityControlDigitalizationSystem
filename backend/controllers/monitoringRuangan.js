// controllers/monitoringRuangan.js
const db = require("../database/db"); // menggunakan pool dari mysql2/promise
const logger = require("../utils/logger");

const allowedRooms = [
  "Ruang_ICP",
  "Ruang_Instrument",
  "Ruang_Preparasi",
  "Ruang_Reagen_1",
  "Ruang_Reagen_02",
  "Ruang_Reagen_3",
  "Ruang_Retained",
  "Ruang_Timbang",
];

exports.dataMonitoringQc = async (req, res) => {
  const { room, start, end } = req.query;

  logger.info(
    `Request received for room: ${room}, start: ${start}, end: ${end}`
  );

  if (!room || !start || !end) {
    logger.error("Missing parameters in request");
    return res.status(400).json({ message: "Missing parameters" });
  }

  if (!allowedRooms.includes(room)) {
    logger.error(`Invalid room selected: ${room}`);
    return res.status(400).json({ message: "Invalid room selected" });
  }

  const startNum = Number(start);
  const endNum = Number(end);
  if (isNaN(startNum) || isNaN(endNum)) {
    logger.error("Invalid timestamp values");
    return res.status(400).json({ message: "Invalid timestamp values" });
  }

  const tableName = `\`cMT-QC_${room}_data\``;

  const query = `
    SELECT \`time@timestamp\` AS timestamp, data_format_0, data_format_1
    FROM ${tableName}
    WHERE \`time@timestamp\` BETWEEN ? AND ?
    ORDER BY \`time@timestamp\` ASC
  `;

  logger.info(
    `Executing query: ${query} with parameters: ${startNum}, ${endNum}`
  );

  try {
    const [rows] = await db.query(query, [startNum, endNum]);
    logger.info(`Query executed successfully, retrieved ${rows.length} rows`);
    res.json(rows);
  } catch (err) {
    logger.error(`Query error: ${err.message}`);
    res.status(500).json({ message: "Query error", error: err.message });
  }
};
