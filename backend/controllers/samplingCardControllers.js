const db = require("../database/dbForKS");
const createSamplingCard = require("../services/createSamplingCard");
const uploadToDrive = require("../utils/uploadDrive");
const { getFileStreamFromDrive } = require("../services/getImageFromGdrive");
const { deleteDriveFile } = require("../utils/deleteDriveFile"); // helper untuk hapus file dari GDrive
const db1 = require("../database/db");

exports.createSamplingCardHandler = async (req, res) => {
  try {
    await createSamplingCard(req, res);
  } catch (error) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

exports.insertSamplingHistory = async (req, res) => {
  const histories = req.body;

  if (!Array.isArray(histories) || histories.length === 0) {
    return res.status(400).json({ error: "Data yang dikirim tidak valid." });
  }

  try {
    const values = histories.map((entry) => [
      entry.card_number,
      entry.history,
      new Date(), // updated_at (timestamp sekarang)
      "system", // atau ganti dengan req.user.name jika pakai auth
    ]);

    const sql = `
          INSERT INTO sampling_card_history
          (card_number, history, updated_at, updated_by)
          VALUES ?
        `;

    await db1.query(sql, [values]);

    res.status(201).json({ message: "Riwayat berhasil disimpan." });
  } catch (err) {
    console.error("Gagal menyimpan riwayat:", err);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat menyimpan ke database." });
  }
};

exports.uploadSamplingImagesHandler = async (req, res) => {
  try {
    const { packaging_type, photo_category } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Tidak ada file yang di-upload." });
    }

    const file = req.files[0];

    if (!file) {
      return res
        .status(400)
        .json({ error: "File tidak ditemukan dalam request." });
    }

    // ⬇️ Jangan dibungkus array lagi! Langsung kirim file
    const driveFile = await uploadToDrive(file, photo_category);

    if (!driveFile || !driveFile.id || !driveFile.webViewLink) {
      throw new Error("Data upload dari Drive tidak lengkap.");
    }

    return res.status(200).json({
      message: "Upload gambar berhasil!",
      packaging_type,
      photo_category,
      fileUrl: driveFile.webViewLink,
      driveId: driveFile.id,
    });
  } catch (error) {
    console.error("❌ Error di uploadSamplingImagesHandler:", error.message);
    return res.status(500).json({
      error: "Gagal upload gambar.",
      message: error.message,
    });
  }
};


exports.getSamplingHistory = async (req, res) => {
  const prefix = req.params.prefix;
  console.log("Prefix yang diterima:", prefix); // Log tambahan untuk melihat nilai prefix

  try {
    const [rows] = await db1.execute(
      `SELECT card_number, history, effective_date
       FROM sampling_card_history
       WHERE LEFT(card_number, 9) = ?
       ORDER BY effective_date DESC
       LIMIT 2`,
      [prefix]
    );

    console.log("Data yang ditemukan:", rows); // Log tambahan untuk melihat data yang diambil

    res.json(rows);
  } catch (err) {
    console.error("Error fetching sampling history:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.streamImage = async (req, res) => {
  const { fileId } = req.params; // Mengambil fileId dari parameter URL

  try {
    // Ambil stream file dan MIME type dari Google Drive
    const { stream, mimeType } = await getFileStreamFromDrive(fileId);

    // Set proper headers untuk streaming file, berdasarkan MIME type
    res.setHeader("Content-Type", mimeType); // MIME type file dari Google Drive
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache file

    // Pipe stream ke response untuk ditampilkan di frontend
    stream.pipe(res);
  } catch (error) {
    console.error("Error streaming image:", error);
    res
      .status(500)
      .json({ message: "Error streaming image", error: error.message });
  }
};

//data tabel list kartu sampling
exports.listSamplingCard = async (req, res) => {
  const filters = req.query;
  console.log("Received filters:", filters);

  let sql = "SELECT * FROM materials";
  const values = [];

  const filterKeys = Object.keys(filters);
  if (filterKeys.length > 0) {
    sql += " WHERE ";
    sql += filterKeys.map((key) => `${key} = ?`).join(" AND ");
    values.push(...filterKeys.map((key) => filters[key]));
  }

  sql += " ORDER BY created_at DESC";

  try {
    console.log("SQL Query:", sql);
    console.log("Values:", values);

    // Menjalankan query menggunakan pool
    const [results] = await db1.query(sql, values);
    console.log("Query Results:", results);

    res.json(results);
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// mengambil No-KS
exports.partSamplingCard = async (req, res) => {
  const filters = req.query;
  let sql = "SELECT * FROM sampling_cards";
  const values = [];

  const filterKeys = Object.keys(filters);
  if (filterKeys.length > 0) {
    sql += " WHERE ";
    sql += filterKeys.map((key) => `${key} = ?`).join(" AND ");
    values.push(...filterKeys.map((key) => filters[key]));
  }

  console.log("SQL Query:", sql); // Log SQL query for debugging
  console.log("Values:", values); // Log values sent to the query

  try {
    // Menjalankan query menggunakan pool
    const [results] = await db1.query(sql, values);
    console.log("Results from database:", results); // Log the result from DB
    res.json(results);
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//approvalController
exports.approveKS = async (req, res) => {
  const { sampling_card_id, role, name, approval_status, notes } = req.body;
  const date = new Date().toISOString().slice(0, 19).replace("T", " ");

  console.log('[approveKS] Body received:', { sampling_card_id, role, name, approval_status, notes });

  if (!sampling_card_id || !role || !name || approval_status === undefined) {
    console.log('[approveKS] Validation failed');
    return res.status(400).json({ status: "error", message: "Missing required fields" });
  }

  let sql = "";
  let approvalValues = [];
  let shouldUpdateMaterialStatus = false;

  switch (role) {
    case "SUPERVISOR QC":
    case "qc_supervisor":
      if (approval_status === 2) {
        sql = `
          UPDATE sampling_approvals
          SET qc_supervisor_approved = ?, qc_supervisor_name = ?, qc_supervisor_approval_date = ?, notes = ?
          WHERE sampling_card_id = ?`;
        approvalValues = [approval_status, name, date, notes, sampling_card_id];
      } else {
        sql = `
          UPDATE sampling_approvals
          SET qc_supervisor_approved = ?, qc_supervisor_name = ?, qc_supervisor_approval_date = ?
          WHERE sampling_card_id = ?`;
        approvalValues = [approval_status, name, date, sampling_card_id];
      }
      break;

    case "MANAGER QC":
    case "qc_manager":
      if (approval_status === 2) {
        sql = `
          UPDATE sampling_approvals
          SET qc_manager_approved = ?, qc_manager_name = ?, qc_manager_approval_date = ?, notes = ?
          WHERE sampling_card_id = ? AND qc_supervisor_approved = 1`;
        approvalValues = [approval_status, name, date, notes, sampling_card_id];
      } else {
        sql = `
          UPDATE sampling_approvals
          SET qc_manager_approved = ?, qc_manager_name = ?, qc_manager_approval_date = ?
          WHERE sampling_card_id = ? AND qc_supervisor_approved = 1`;
        approvalValues = [approval_status, name, date, sampling_card_id];
      }
      break;

    case "MANAGER QA":
    case "qa_manager":
      if (approval_status === 2) {
        sql = `
          UPDATE sampling_approvals
          SET qa_manager_approved = ?, qa_manager_name = ?, qa_manager_approval_date = ?, notes = ?
          WHERE sampling_card_id = ? AND qc_manager_approved = 1`;
        approvalValues = [approval_status, name, date, notes, sampling_card_id];
      } else {
        sql = `
          UPDATE sampling_approvals
          SET qa_manager_approved = ?, qa_manager_name = ?, qa_manager_approval_date = ?
          WHERE sampling_card_id = ? AND qc_manager_approved = 1`;
        approvalValues = [approval_status, name, date, sampling_card_id];
      }
      shouldUpdateMaterialStatus = approval_status === 1;
      break;

    default:
      console.log('[approveKS] Invalid role');
      return res.status(400).json({ status: "error", message: "Invalid role" });
  }

  console.log('[approveKS] Running SQL:', sql);
  console.log('[approveKS] With values:', approvalValues);

  try {
    const [result] = await db1.query(sql, approvalValues);
    console.log('[approveKS] Query result:', result);

    if (result.affectedRows > 0) {
      if (shouldUpdateMaterialStatus) {
        const updateMaterialSql = `
          UPDATE materials
          SET status = 'Approved'
          WHERE id = ?`;
        await db1.query(updateMaterialSql, [sampling_card_id]);
        console.log(`[approveKS] Updated material status to 'Approved' for ID ${sampling_card_id}`);
      }

      return res.status(200).json({
        status: "success",
        message:
          approval_status === 1
            ? `Approved by ${role}`
            : `Rejected by ${role}`,
        updated: true,
      });
    } else {
      return res.status(200).json({
        status: "warning",
        message: "No rows were updated. It may already be approved or condition not met.",
        updated: false,
      });
    }
  } catch (err) {
    console.error('[approveKS] DB Error:', err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};


    

//getCardSamplingWithStatusPending
exports.getUnapprovedSamplingCards = async (req, res) => {
  try {
    const [result] = await db1.query(`
          SELECT
              m.id AS material_id,
              m.nama_material AS material_name,
              m.created_by,
              m.created_at,
              sc.card_number,
              sa.sampling_card_id,
              sa.qc_supervisor_approved,
              sa.qc_manager_approved,
              sa.qa_manager_approved,
              sa.notes
          FROM
              sampling_cards sc
          JOIN
              materials m ON sc.material_id = m.id
          LEFT JOIN
              sampling_approvals sa ON sc.id = sa.sampling_card_id
          WHERE
              sa.qc_supervisor_approved = 0
              OR sa.qc_manager_approved = 0
              OR sa.qa_manager_approved = 0
              OR sa.qa_manager_approved = 2
              OR sa.sampling_card_id IS NULL
          ORDER BY
              m.created_at DESC;
        `);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching unapproved sampling cards:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//getApprovalController
exports.getApprovalKS = async (req, res) => {
  const { sampling_card_id } = req.query;

  let sql = `
    SELECT a.*, c.card_number
    FROM sampling_approvals a
    LEFT JOIN sampling_cards c ON a.sampling_card_id = c.id
  `;
  const values = [];

  if (sampling_card_id) {
    sql += " WHERE a.sampling_card_id = ?";
    values.push(sampling_card_id);
  }

  try {
    const [rows] = await db1.query(sql, values);
    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Query error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

//delete sampling card
exports.deleteMaterialById = (req, res) => {
  const connection = db1;
  const materialId = req.params.id;

  connection.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Transaction start failed" });

    const getCardsSql = `SELECT id FROM sampling_cards WHERE material_id = ?`;
    connection.query(getCardsSql, [materialId], (err, cards) => {
      if (err) return rollback(connection, res, err);

      const cardIds = cards.map((row) => row.id);
      if (cardIds.length === 0) {
        return deleteMaterialOnly(connection, res, materialId);
      }

      const deleteCardSql = `DELETE FROM sampling_cards WHERE material_id = ?`;
      connection.query(deleteCardSql, [materialId], (err) => {
        if (err) return rollback(connection, res, err);

        deleteMaterialOnly(connection, res, materialId);
      });
    });
  });
};

function deleteMaterialOnly(connection, res, materialId) {
  const sql = `DELETE FROM materials WHERE id = ?`;
  connection.query(sql, [materialId], (err) => {
    if (err) return rollback(connection, res, err);

    connection.commit((err) => {
      if (err) return rollback(connection, res, err);
      res.status(200).json({ message: "Material successfully deleted" });
    });
  });
}

exports.deleteSamplingCard = async (req, res) => {
  const { id } = req.params;
  const connection = await db1.getConnection();

  try {
    await connection.beginTransaction();
    console.log(`🗑️ Mulai hapus sampling_card_id: ${id}`);

    // Ambil daftar file dari gallery_photos
    const [photos] = await connection.query(
      "SELECT google_drive_file_id FROM gallery_photos WHERE sampling_card_id = ?",
      [id]
    );

    // Hapus file dari Google Drive
    for (const photo of photos) {
      if (photo.google_drive_file_id) {
        await deleteDriveFile(photo.google_drive_file_id);
      }
    }
    console.log(`✅ ${photos.length} file Google Drive diproses.`);

    // Hapus dari semua tabel terkait
    await connection.query("DELETE FROM samples WHERE sampling_card_id = ?", [id]);
    await connection.query("DELETE FROM gallery_photos WHERE sampling_card_id = ?", [id]);
    await connection.query("DELETE FROM sampling_conditions WHERE sampling_card_id = ?", [id]);
    await connection.query("DELETE FROM sampling_approvals WHERE sampling_card_id = ?", [id]);

    // Ambil material_id sebelum menghapus kartu
    const [cardRows] = await connection.query(
      "SELECT material_id FROM sampling_cards WHERE id = ?",
      [id]
    );
    const materialId = cardRows.length > 0 ? cardRows[0].material_id : null;

    // Hapus kartu sampling
    await connection.query("DELETE FROM sampling_cards WHERE id = ?", [id]);
    console.log("🗑️ Sampling card berhasil dihapus dari database.");

    // Hapus material jika tidak dipakai di kartu lain
    if (materialId) {
      const [relatedCards] = await connection.query(
        "SELECT id FROM sampling_cards WHERE material_id = ?",
        [materialId]
      );
      if (relatedCards.length === 0) {
        await connection.query("DELETE FROM materials WHERE id = ?", [materialId]);
        console.log("🗑️ Material juga dihapus karena tidak digunakan lagi.");
      }
    }

    await connection.commit();
    res.status(200).json({ message: "✅ Sampling card dan file terkait berhasil dihapus." });

  } catch (err) {
    console.error("❌ Gagal hapus data:", err.message);
    await connection.rollback();
    res.status(500).json({ error: "Gagal menghapus data", details: err.message });

  } finally {
    connection.release();
    console.log("🔚 Koneksi database dilepas.");
  }
};


//mengambil semua data kartu sampling
exports.getMaterialDetail = async (req, res) => {
  const materialId = req.params.id;
  console.log("🔎 MATERIAL ID YANG DITERIMA:", materialId);

  try {
    // Ambil detail material + sampling_card_id + approvals
    const [rows] = await db1.query(
      `
      SELECT 
        m.id AS material_id,
        m.nama_material,
        m.kode_item,
        m.manufacture,
        sc.id AS sampling_card_id,
        sc.card_number,
        sc.effective_date,
        sc.expired_date,
        sc.storage_condition,
        sc.manufacturer_status,
        cond.condition_desc,
        cond.outer_packaging,
        cond.inner_packaging,
        cond.sampling_method,
        cond.tools_used,
        cond.sampling_process,
        cond.cleaning_tools,
        MAX(CASE WHEN s.sample_type = 'reduce' THEN s.sample_volume END) AS reduce,
        MAX(CASE WHEN s.sample_type = 'non_reduce' THEN s.sample_volume END) AS non_reduce,
        MAX(CASE WHEN s.sample_type = 'lod' THEN s.sample_volume END) AS lod,
        MAX(CASE WHEN s.sample_type = 'pertinggal' THEN s.sample_volume END) AS pertinggal,
        MAX(CASE WHEN s.sample_type = 'mikro' THEN s.sample_volume END) AS mikro,
        MAX(CASE WHEN s.sample_type = 'uji_luar' THEN s.sample_volume END) AS uji_luar,
        sa.qc_supervisor_approved,
        sa.qc_supervisor_name,
        sa.qc_supervisor_approval_date,
        sa.qc_manager_approved,
        sa.qc_manager_name,
        sa.qc_manager_approval_date,
        sa.qa_manager_approved,
        sa.qa_manager_name,
        sa.qa_manager_approval_date,
        sa.notes AS approval_notes
      FROM materials m
      JOIN sampling_cards sc ON m.id = sc.material_id
      LEFT JOIN sampling_conditions cond ON sc.id = cond.sampling_card_id
      LEFT JOIN samples s ON sc.id = s.sampling_card_id
      LEFT JOIN sampling_approvals sa ON sc.id = sa.sampling_card_id
      WHERE m.id = ?
      GROUP BY m.id, sc.id, cond.id, sa.id
      `,
      [materialId]
    );

    if (rows.length === 0) {
      console.warn(`[⚠️ WARNING] Material dengan ID ${materialId} tidak ditemukan.`);
      return res.status(404).json({ message: "Material not found" });
    }

    const materialDetail = rows[0];
    const samplingCardId = materialDetail.sampling_card_id;

    // Ambil data foto dari gallery_photos
    const [photoRows] = await db1.query(
      `
      SELECT 
        packaging_type,
        photo_category,
        google_drive_file_id,
        file_name
      FROM gallery_photos
      WHERE sampling_card_id = ?
      ORDER BY uploaded_at ASC
      `,
      [samplingCardId]
    );

    // Format foto ke dalam struktur JSON terstruktur
    const groupedPhotos = {};

    for (const photo of photoRows) {
      const {
        packaging_type,
        photo_category,
        google_drive_file_id,
        file_name,
      } = photo;

      if (!groupedPhotos[packaging_type]) {
        groupedPhotos[packaging_type] = {};
      }

      if (!groupedPhotos[packaging_type][photo_category]) {
        groupedPhotos[packaging_type][photo_category] = [];
      }

      groupedPhotos[packaging_type][photo_category].push({
        src: google_drive_file_id,
        file_name: file_name,
        caption: `${photo_category} - ${file_name}`,
      });
    }

    // Masukkan ke dalam response
    materialDetail.gallery_photos = groupedPhotos;

    console.log("📦 DETAIL MATERIAL YANG DITEMUKAN:");
    console.log(JSON.stringify(materialDetail, null, 2));

    res.json(materialDetail);
  } catch (error) {
    console.error("❌ QUERY ERROR:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// mengambil semua data Kartu Sampling berdasarkan Card_Number
exports.getMaterialDetailByCardNumber = async (req, res) => {
  const cardNumber = req.params.card_number;
  console.log("🔎 CARD NUMBER YANG DITERIMA:", cardNumber);

  try {
    // Ambil detail material berdasarkan card_number
    const [rows] = await db1.query(
      `
      SELECT 
        m.id AS material_id,
        m.nama_material,
        m.kode_item,
        m.manufacture,
        sc.id AS sampling_card_id,
        sc.card_number,
        sc.effective_date,
        sc.expired_date,
        sc.storage_condition,
        sc.manufacturer_status,
        cond.condition_desc,
        cond.outer_packaging,
        cond.inner_packaging,
        cond.sampling_method,
        cond.tools_used,
        cond.sampling_process,
        cond.cleaning_tools,
        MAX(CASE WHEN s.sample_type = 'reduce' THEN s.sample_volume END) AS reduce,
        MAX(CASE WHEN s.sample_type = 'non_reduce' THEN s.sample_volume END) AS non_reduce,
        MAX(CASE WHEN s.sample_type = 'lod' THEN s.sample_volume END) AS lod,
        MAX(CASE WHEN s.sample_type = 'pertinggal' THEN s.sample_volume END) AS pertinggal,
        MAX(CASE WHEN s.sample_type = 'mikro' THEN s.sample_volume END) AS mikro,
        MAX(CASE WHEN s.sample_type = 'uji_luar' THEN s.sample_volume END) AS uji_luar,
        sa.qc_supervisor_approved,
        sa.qc_supervisor_name,
        sa.qc_supervisor_approval_date,
        sa.qc_manager_approved,
        sa.qc_manager_name,
        sa.qc_manager_approval_date,
        sa.qa_manager_approved,
        sa.qa_manager_name,
        sa.qa_manager_approval_date,
        sa.notes AS approval_notes
      FROM sampling_cards sc
      JOIN materials m ON m.id = sc.material_id
      LEFT JOIN sampling_conditions cond ON sc.id = cond.sampling_card_id
      LEFT JOIN samples s ON sc.id = s.sampling_card_id
      LEFT JOIN sampling_approvals sa ON sc.id = sa.sampling_card_id
      WHERE sc.card_number = ?
      GROUP BY m.id, sc.id, cond.id, sa.id
      `,
      [cardNumber]
    );

    if (rows.length === 0) {
      console.warn(`[⚠️ WARNING] Sampling Card dengan nomor ${cardNumber} tidak ditemukan.`);
      return res.status(404).json({ message: "Sampling Card not found" });
    }

    const materialDetail = rows[0];
    const samplingCardId = materialDetail.sampling_card_id;

    // Ambil foto berdasarkan sampling_card_id
    const [photoRows] = await db1.query(
      `
      SELECT 
        packaging_type,
        photo_category,
        google_drive_file_id,
        file_name
      FROM gallery_photos
      WHERE sampling_card_id = ?
      ORDER BY uploaded_at ASC
      `,
      [samplingCardId]
    );

    // Format dan grup foto berdasarkan packaging_type dan photo_category
    const groupedPhotos = {};

    for (const photo of photoRows) {
      const {
        packaging_type,
        photo_category,
        google_drive_file_id,
        file_name,
      } = photo;

      if (!groupedPhotos[packaging_type]) {
        groupedPhotos[packaging_type] = {};
      }

      if (!groupedPhotos[packaging_type][photo_category]) {
        groupedPhotos[packaging_type][photo_category] = [];
      }

      groupedPhotos[packaging_type][photo_category].push({
        src: google_drive_file_id,
        file_name,
        caption: `${photo_category} - ${file_name}`,
      });
    }

    materialDetail.gallery_photos = groupedPhotos;

    console.log("📦 DETAIL MATERIAL BERDASARKAN CARD NUMBER:");
    console.log(JSON.stringify(materialDetail, null, 2));

    res.json(materialDetail);
  } catch (error) {
    console.error("❌ QUERY ERROR:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};