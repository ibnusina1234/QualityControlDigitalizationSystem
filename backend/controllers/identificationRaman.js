const dayjs = require("dayjs");
require("dayjs/plugin/utc");
require("dayjs/plugin/timezone");
dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("dayjs/plugin/timezone"));
const db1 = require("../database/db");

// REVISI: gunakan ISO 8601 + offset untuk semua pengiriman waktu ke frontend!
// Waktu UTC untuk disimpan ke database (db1 kolom DATETIME, tanpa offset)
function nowUTC() {
  return dayjs().utc().format("YYYY-MM-DD HH:mm:ss"); // Simpan dalam UTC
}
// Untuk frontend (konversi ke WIB, tampilkan dengan offset)
function toWIB(utcDate) {
  if (!utcDate) return null;
  return dayjs.utc(utcDate).tz("Asia/Jakarta").format("YYYY-MM-DDTHH:mm:ssZ");
}

// Get all requests for a batch (with progress)
exports.getRequestsByBatch = async (req, res) => {
  const { batch_number } = req.params;
  try {
    // Get batch & material
    const [batchRows] = await db1.query(
      `SELECT b.id, b.batch_number, b.vat_count, b.material_id, m.name AS material
            FROM batches b JOIN materialraman m ON b.material_id = m.id
            WHERE b.batch_number = ?`,
      [batch_number]
    );
    if (!batchRows.length)
      return res.status(404).json({ message: "Batch not found" });

    // Get requests
    const [requests] = await db1.query(
      `SELECT r.*, u.name AS operator_name, i.name AS inspector_name
            FROM raman_requests r
            JOIN user u ON r.operator_id = u.id
            LEFT JOIN user i ON r.inspector_id = i.id
            WHERE r.batch_id = ?
            ORDER BY r.requested_at ASC`,
      [batchRows[0].id]
    );
    // Get vats for each request
    for (let reqRow of requests) {
      const [vats] = await db1.query(
        `SELECT vat_number FROM request_vats WHERE request_id = ? ORDER BY vat_number ASC`,
        [reqRow.id]
      );
      reqRow.identified_vats = vats.map((v) => v.vat_number);

      // Konversi waktu dari UTC ke WIB (ISO format, ada offset)
      reqRow.requested_at = toWIB(reqRow.requested_at);
      reqRow.processed_at = toWIB(reqRow.processed_at);
      reqRow.completed_at = toWIB(reqRow.completed_at);
    }

    // Get all identified vats for the batch (across all requests)
    const [allVats] = await db1.query(
      `SELECT DISTINCT rv.vat_number
            FROM request_vats rv
            JOIN raman_requests rr ON rv.request_id = rr.id
            WHERE rr.batch_id = ?`,
      [batchRows[0].id]
    );
    const allIdentifiedVats = allVats.map((v) => v.vat_number);

    res.json({
      batch: batchRows[0],
      requests,
      all_identified_vats: allIdentifiedVats,
      total_identified: allIdentifiedVats.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Endpoint: GET /batches/:batch_number/used-vats?material_id=...
exports.getUsedVatsForBatch = async (req, res) => {
  const { batch_number } = req.params;
  const { material_id } = req.query;
  try {
    const [batchRows] = await db1.query(
      `SELECT id FROM batches WHERE batch_number = ? AND material_id = ?`,
      [batch_number, material_id]
    );
    if (!batchRows.length) return res.json([]);
    const batch_id = batchRows[0].id;

    const [requests] = await db1.query(
      `SELECT id FROM raman_requests WHERE batch_id = ?`,
      [batch_id]
    );
    const requestIds = requests.map((r) => r.id);
    if (!requestIds.length) return res.json([]);

    const placeholders = requestIds.map(() => "?").join(",");
    const [vats] = await db1.query(
      `SELECT DISTINCT vat_number FROM request_vats WHERE request_id IN (${placeholders})`,
      requestIds
    );
    res.json(vats.map((v) => v.vat_number));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRamanRequest = async (req, res) => {
  const {
    material_name,
    operator_id,
    batch_number,
    vat_count,
    tanggal_timbang,
    requested_at,
  } = req.body;
  try {
    let [material] = await db1.query(
      `SELECT id FROM materialraman WHERE name = ?`,
      [material_name]
    );
    if (!material.length) {
      const [result] = await db1.query(
        `INSERT INTO materialraman (name) VALUES (?)`,
        [material_name]
      );
      material = [{ id: result.insertId }];
    }
    const material_id = material[0].id;

    let [batchRows] = await db1.query(
      `SELECT id, vat_count FROM batches WHERE batch_number = ? AND material_id = ?`,
      [batch_number, material_id]
    );
    let batch_id;
    if (!batchRows.length) {
      const [result] = await db1.query(
        `INSERT INTO batches (batch_number, material_id, vat_count,tanggal_timbang) VALUES (?, ?, ?,?)`,
        [batch_number, material_id, vat_count, tanggal_timbang]
      );
      batch_id = result.insertId;
    } else {
      batch_id = batchRows[0].id;
      if (parseInt(batchRows[0].vat_count) !== parseInt(vat_count)) {
        return res.status(400).json({
          message: `Batch sudah ada (${batch_number}) untuk material tersebut dengan jumlah vat ${batchRows[0].vat_count}. Tidak bisa input jumlah vat berbeda!`,
        });
      }
      // Update tanggal_timbang jika ingin selalu mengupdate field-nya:
      await db1.query(`UPDATE batches SET tanggal_timbang = ? WHERE id = ?`, [
        tanggal_timbang,
        batch_id,
      ]);
    }

    // Simpan waktu dalam UTC
    const waktuRequest = requested_at
      ? dayjs(requested_at).utc().format("YYYY-MM-DD HH:mm:ss")
      : nowUTC();

    console.log("DATA AKAN DISIMPAN", {
      batch_id,
      material_id,
      operator_id,
      requested_at,
    });
    const [result] = await db1.query(
      `INSERT INTO raman_requests (batch_id, material_id, operator_id, requested_at, status)
            VALUES (?, ?, ?, ?, 'request')`,
      [batch_id, material_id, operator_id, waktuRequest]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.progressRequest = async (req, res) => {
  const { request_id } = req.params;
  const { inspector_id, processed_at } = req.body;
  try {
    const [reqRows] = await db1.query(
      `SELECT id FROM raman_requests WHERE id = ?`,
      [request_id]
    );
    if (!reqRows.length)
      return res.status(404).json({ message: "Request not found" });

    // Simpan waktu dalam UTC
    const waktuProcessed = processed_at
      ? dayjs(processed_at).utc().format("YYYY-MM-DD HH:mm:ss")
      : nowUTC();

    await db1.query(
      `UPDATE raman_requests
            SET status = 'progress',
            inspector_id = ?, processed_at = ?
            WHERE id = ?`,
      [inspector_id, waktuProcessed, request_id]
    );
    res.json({ message: "Request on progress" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  const { request_id } = req.params;
  try {
    await db1.query("DELETE FROM request_vats WHERE request_id = ?", [
      request_id,
    ]);
    await db1.query("DELETE FROM raman_requests WHERE id = ?", [request_id]);
    res.json({ message: "Request deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitVats = async (req, res) => {
  const { request_id } = req.params;
  const { vats } = req.body;
  try {
    if (!vats || !Array.isArray(vats) || vats.length === 0) {
      return res.status(400).json({ message: "Vats kosong" });
    }
    for (let vat of vats) {
      await db1.query(
        `INSERT IGNORE INTO request_vats (request_id, vat_number)
            VALUES (?, ?)`,
        [request_id, vat]
      );
    }
    res.json({ message: "Vats updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeRequest = async (req, res) => {
  const { request_id } = req.params;
  const { completed_at } = req.body;
  try {
    const [reqRows] = await db1.query(
      `SELECT batch_id FROM raman_requests WHERE id = ?`,
      [request_id]
    );
    if (!reqRows.length)
      return res.status(404).json({ message: "Request not found" });
    const batch_id = reqRows[0].batch_id;

    const [allVats] = await db1.query(
      `SELECT DISTINCT rv.vat_number
            FROM request_vats rv
            JOIN raman_requests rr ON rv.request_id = rr.id
            WHERE rr.batch_id = ?`,
      [batch_id]
    );
    const allIdentifiedVats = allVats.map((v) => v.vat_number);

    // Simpan waktu dalam UTC
    const waktuComplete = completed_at
      ? dayjs(completed_at).utc().format("YYYY-MM-DD HH:mm:ss")
      : nowUTC();

    await db1.query(
      `UPDATE raman_requests
            SET status = 'complete',
            completed_at = ?
            WHERE id = ?`,
      [waktuComplete, request_id]
    );
    res.json({
      message: "Request completed",
      all_identified_vats: allIdentifiedVats,
      total_identified: allIdentifiedVats.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editRequestWithReason = async (req, res) => {
  const { request_id } = req.params;
  const { user_id, field, old_value, new_value, reason, vat_number } = req.body;
  try {
    await db1.query(`UPDATE raman_requests SET ${field} = ? WHERE id = ?`, [
      new_value,
      request_id,
    ]);
    await db1.query(
      `INSERT INTO edit_logs (request_id, user_id, vat_number, old_value, new_value, reason)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [request_id, user_id, vat_number || null, old_value, new_value, reason]
    );
    res.json({ message: "Request updated with reason" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
