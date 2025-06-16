const db = require("../database/dbForKs");

const createSamplingCard = async (req, res) => {
  const connection = await db.getConnection();
  console.log("🔌 Koneksi database diambil dari pool.");

  try {
    await connection.beginTransaction();
    console.log("🛠️  Transaksi database dimulai.");

    const {
      nama_material,
      kode_item,
      manufacture,
      card_number,
      effective_date,
      expired_date,
      storage_condition,
      manufacturer_status,
      condition_desc,
      outer_packaging,
      inner_packaging,
      sampling_method,
      tools_used,
      sampling_process,
      cleaning_tools,
      samples,
      created_by,
      uploaded_links, // <--- pake ini
    } = req.body;

    // Validasi input wajib
    if (!nama_material || !kode_item || !manufacture || !created_by || !card_number) {
      throw new Error("❌ Field wajib tidak lengkap!");
    }

    // Cek duplikasi card_number
    const [existing] = await connection.query(
      "SELECT id FROM sampling_cards WHERE card_number = ?",
      [card_number]
    );
    if (existing.length > 0) {
      throw new Error("❌ Sampling card dengan nomor kartu ini sudah ada!");
    }

    // Insert ke materials
    const [materialResult] = await connection.query(
      `INSERT INTO materials (nama_material, kode_item, manufacture, created_at, created_by)
       VALUES (?, ?, ?, NOW(), ?)`,
      [nama_material, kode_item, manufacture, created_by]
    );
    const materialId = materialResult.insertId;
    console.log("✅ Data material disimpan, ID:", materialId);

    // Insert ke sampling_cards
    const [cardResult] = await connection.query(
      `INSERT INTO sampling_cards (material_id, card_number, effective_date, expired_date, storage_condition, manufacturer_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [materialId, card_number, effective_date, expired_date, storage_condition, manufacturer_status]
    );
    const cardId = cardResult.insertId;
    console.log("✅ Data sampling card disimpan, ID:", cardId);

    // Insert default approval
    await connection.query(
      `INSERT INTO sampling_approvals (
         sampling_card_id,
         qc_supervisor_approved, qc_supervisor_name, qc_supervisor_approval_date,
         qc_manager_approved, qc_manager_name, qc_manager_approval_date,
         qa_manager_approved, qa_manager_name, qa_manager_approval_date,
         notes
       ) VALUES (?, 0, "NA", NOW(), 0, "NA", NOW(), 0, "NA", NOW(), "NA")`,
      [cardId]
    );
    console.log("✅ Data approval default disimpan.");

    // Insert kondisi sampling
    await connection.query(
      `INSERT INTO sampling_conditions (
         sampling_card_id, condition_desc, outer_packaging, inner_packaging,
         sampling_method, tools_used, sampling_process, cleaning_tools
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cardId,
        condition_desc,
        outer_packaging,
        inner_packaging,
        sampling_method,
        tools_used,
        sampling_process,
        cleaning_tools,
      ]
    );
    console.log("✅ Data kondisi sampling disimpan.");

    // Insert uploaded images ke gallery_photos
    if (Array.isArray(uploaded_links) && uploaded_links.length > 0) {
      const validLinks = uploaded_links.filter(
        (img) => img && img.packaging_type && img.photo_category && img.driveId && img.name && img.webViewLink
      );

      if (validLinks.length > 0) {
        const galleryInsertPromises = validLinks.map((img) =>
          connection.query(
            `INSERT INTO gallery_photos (
              sampling_card_id, packaging_type, photo_category, 
              google_drive_file_id, file_name, file_link, uploaded_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
              cardId,
              img.packaging_type,
              img.photo_category,
              img.driveId,
              img.name,
              img.webViewLink,
            ]
          )
        );

        await Promise.all(galleryInsertPromises);
        console.log(`✅ ${validLinks.length} foto valid berhasil disimpan ke gallery_photos.`);
      } else {
        console.warn("⚠️ Tidak ada uploaded_links yang valid, skip insert gallery_photos.");
      }
    } else {
      console.warn("⚠️ uploaded_links kosong atau bukan array, skip insert gallery_photos.");
    }

    // Insert samples
    if (samples && Object.keys(samples).length > 0) {
      const sampleEntries = Object.entries(samples).filter(([_, vol]) => vol);

      const samplePromises = sampleEntries.map(([sample_type, sample_volume]) =>
        connection.query(
          `INSERT INTO samples (sampling_card_id, sample_type, sample_volume)
           VALUES (?, ?, ?)`,
          [cardId, sample_type, sample_volume]
        )
      );

      await Promise.all(samplePromises);
      console.log(`✅ ${sampleEntries.length} sample disimpan.`);
    }

    // Commit transaksi
    await connection.commit();
    console.log("🎉 Transaksi database berhasil di-commit.");

    // Beri response
    res.status(201).json({
      message: "Sampling card berhasil dibuat.",
      material_id: materialId,
      sampling_card_id: cardId,
    });

  } catch (err) {
    console.error("❗ Error terjadi, rollback transaksi:", err.message);
    if (connection) await connection.rollback();

    res.status(500).json({
      error: "Terjadi kesalahan",
      details: err.message,
    });

  } finally {
    if (connection) connection.release();
    console.log("🔚 Koneksi database dilepas (release).");
  }
};

module.exports = createSamplingCard;
