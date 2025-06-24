const express = require("express");
const router = express.Router();
const ramanController = require("../controllers/identificationRaman");
const { getBatchListFromSheet } = require("../utils/getDataSpreadsheet");
const dayjs = require("dayjs");
require("dayjs/plugin/utc");
require("dayjs/plugin/timezone");
dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("dayjs/plugin/timezone"));
const db1 = require("../database/db");

// CREATE: Warehouse create new request (only material, operator)
router.post("/request", ramanController.createRamanRequest);

// GET: All requests across all batch (global dashboard)
router.get("/all-requests", async (req, res) => {
  const db = require("../database/db1ForKS");
  try {
    const [rows] = await db1.query(`
      
      SELECT 
        r.id, r.batch_id, r.material_id,
        COALESCE(mb.name, mr.name) AS material,
        b.batch_number, b.vat_count, 
        r.operator_id, u.nama_lengkap AS operator_name, 
        r.inspector_id, i.nama_lengkap AS inspector_name,
        r.requested_at, r.processed_at, r.completed_at, 
        r.status
      FROM raman_requests r
      LEFT JOIN batches b ON r.batch_id = b.id
      LEFT JOIN materialraman mb ON b.material_id = mb.id
      LEFT JOIN materialraman mr ON r.material_id = mr.id
      JOIN user u ON r.operator_id = u.id
      LEFT JOIN user i ON r.inspector_id = i.id
      ORDER BY r.requested_at DESC
    `);

    // Add identified vats for each request
    for (const req of rows) {
      const [vats] = await db1.query(
        `SELECT vat_number FROM request_vats WHERE request_id = ? ORDER BY vat_number ASC`,
        [req.id]
      );
      req.identified_vats = vats.map((v) => v.vat_number);

      // Konversi waktu ke WIB (Asia/Jakarta)
      if (req.requested_at)
        req.requested_at = dayjs(req.requested_at)
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DDTHH:mm:ssZ");
      if (req.processed_at)
        req.processed_at = dayjs(req.processed_at)
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DDTHH:mm:ssZ");
      if (req.completed_at)
        req.completed_at = dayjs(req.completed_at)
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DDTHH:mm:ssZ");
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get materialId by name
router.get("/material-id", async (req, res) => {
  const db= require("../database/db1ForKS");
  const { name } = req.query;
  if (!name) return res.status(400).json({ message: "Missing name" });
  const [rows] = await db1.query(
    "SELECT id FROM materialraman WHERE name = ?",
    [name]
  );
  if (!rows.length)
    return res.status(404).json({ message: "Material not found" });
  res.json({ id: rows[0].id });
});

router.get("/sheet-batch", async (req, res) => {
  const { material_name } = req.query;
  if (!material_name)
    return res.status(400).json({ message: "material_name required" });
  try {
    const batchList = await getBatchListFromSheet(material_name);
    res.json(batchList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check batch exist by material_id & batch_number
router.get("/batch-exist", async (req, res) => {
  const db = require("../database/db1ForKS");
  const { material_id, batch_number } = req.query;
  if (!material_id || !batch_number)
    return res.status(400).json({ message: "Missing params" });
  const [rows] = await db1.query(
    "SELECT id, vat_count FROM batches WHERE material_id = ? AND batch_number = ?",
    [material_id, batch_number]
  );
  if (!rows.length) return res.json({ exists: false });
  res.json({ exists: true, vat_count: rows[0].vat_count });
});

// GET: All requests for a specific batch
router.get("/batch/:batch_number", ramanController.getRequestsByBatch);

// DELETE: Hapus request raman (by id)
router.delete("/request/:request_id", ramanController.deleteRequest);

// PATCH: Progress (QC assign batch, lot, vat_count, etc)
router.patch("/request/:request_id/progress", ramanController.progressRequest);

// POST: Submit vats (QC input vat numbers)
router.post("/request/:request_id/vats", ramanController.submitVats);

// PATCH: Complete request (QC set complete)
router.patch("/request/:request_id/complete", ramanController.completeRequest);

router.get(
  "/batches/:batch_number/used-vats",
  ramanController.getUsedVatsForBatch
);

// PATCH: Edit request with reason (audit trail)
router.patch(
  "/request/:request_id/edit",
  ramanController.editRequestWithReason
);

module.exports = router;
