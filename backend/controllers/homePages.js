// Dependencies
const db = require('../database/db'); // Adjust the path according to your project structure
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../credentials.json"),
  scopes: SCOPES,
});

exports.streamImage = async (req, res) => {
  try {
    const { fileId } = req.params;
    const drive = google.drive({ version: "v3", auth });

    // Get file metadata
    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'mimeType,name',
    });

    // Get file stream
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'stream' });

    // Set headers
    res.setHeader('Content-Type', fileMetadata.data.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileMetadata.data.name}"`);

    // Pipe the stream to response
    response.data
      .on('error', err => {
        console.error('Error streaming file:', err);
        res.status(500).end();
      })
      .pipe(res);
  } catch (error) {
    console.error('Error streaming image:', error);
    res.status(500).json({ error: 'Failed to stream image' });
  }
};

/**
 * GET /api/HomePages
 * Get all homepage editable data
 */
exports.getHomePagesData = async (req, res) => {
  try {
    // Get personnel
    const [personnel] = await db.execute('SELECT * FROM personnel ORDER BY id ASC');
    // Get company images
    const [companyImages] = await db.execute('SELECT * FROM company_images ORDER BY id ASC');
    // Get divisions
    const [divisions] = await db.execute('SELECT * FROM divisions ORDER BY id ASC');
    // Get division members
    const [divisionMembers] = await db.execute('SELECT * FROM member_division ORDER BY id ASC');
    // Get page content (assuming only one row)
    const [pageContentRows] = await db.execute('SELECT * FROM page_content LIMIT 1');
    const pageContent = pageContentRows[0] || {};

    return res.json({
      personnel,
      companyImages,
      divisions,
      divisionMembers,
      pageContent
    });
  } catch (err) {
    console.error('Error fetching home page data:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/edit-home-pages/content
 * Update page content (edit text sections)
 */
exports.updatePageContent = async (req, res) => {
  const { hero_title, hero_subtitle, about_description, mission_text } = req.body;
  try {
    // Only one row, update id = 1 (or upsert)
    const [check] = await db.execute('SELECT id FROM page_content LIMIT 1');
    if (check.length > 0) {
      await db.execute(
        'UPDATE page_content SET hero_title=?, hero_subtitle=?, about_description=?, mission_text=? WHERE id=?',
        [hero_title, hero_subtitle, about_description, mission_text, check[0].id]
      );
      return res.json({ success: true, message: 'Page content updated' });
    } else {
      await db.execute(
        'INSERT INTO page_content (hero_title, hero_subtitle, about_description, mission_text) VALUES (?, ?, ?, ?)',
        [hero_title, hero_subtitle, about_description, mission_text]
      );
      return res.json({ success: true, message: 'Page content created' });
    }
  } catch (err) {
    console.error('Error updating page content:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/edit-home-pages/personnel
 * Add new personnel
 */
exports.addPersonnel = async (req, res) => {
  const { name, role, image_url } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO personnel (name, role, image_url) VALUES (?, ?, ?)',
      [name, role, image_url || '']
    );
    return res.json({ success: true, message: 'Personnel added', id: result.insertId });
  } catch (err) {
    console.error('Error adding personnel:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/edit-home-pages/personnel/:id
 * Update personnel by id
 */
exports.updatePersonnel = async (req, res) => {
  const { id } = req.params;
  const { name, role, image_url } = req.body;
  try {
    await db.execute(
      'UPDATE personnel SET name=?, role=?, image_url=? WHERE id=?',
      [name, role, image_url || '', id]
    );
    return res.json({ success: true, message: 'Personnel updated' });
  } catch (err) {
    console.error('Error updating personnel:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/edit-home-pages/personnel/:id
 * Delete personnel by id
 */
exports.deletePersonnel = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM personnel WHERE id=?', [id]);
    return res.json({ success: true, message: 'Personnel deleted' });
  } catch (err) {
    console.error('Error deleting personnel:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/edit-home-pages/company-image
 * Add company image
 */
exports.addCompanyImage = async (req, res) => {
  const { url, title, description } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO company_images (url, title, description) VALUES (?, ?, ?)',
      [url || '', title, description]
    );
    return res.json({ success: true, message: 'Company image added', id: result.insertId });
  } catch (err) {
    console.error('Error adding company image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/edit-home-pages/company-image/:id
 * Update company image
 */
exports.updateCompanyImage = async (req, res) => {
  const { id } = req.params;
  const { url, title, description } = req.body;
  try {
    await db.execute(
      'UPDATE company_images SET url=?, title=?, description=? WHERE id=?',
      [url || '', title, description, id]
    );
    return res.json({ success: true, message: 'Company image updated' });
  } catch (err) {
    console.error('Error updating company image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/edit-home-pages/company-image/:id
 * Delete company image
 */
exports.deleteCompanyImage = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM company_images WHERE id=?', [id]);
    return res.json({ success: true, message: 'Company image deleted' });
  } catch (err) {
    console.error('Error deleting company image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/edit-home-pages/division
 * Add division
 */
exports.addDivision = async (req, res) => {
  const { name, icon, member_count } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO divisions (name, icon, member_count) VALUES (?, ?, ?)',
      [name, icon, member_count || 0]
    );
    return res.json({ success: true, message: 'Division added', id: result.insertId });
  } catch (err) {
    console.error('Error adding division:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/edit-home-pages/division/:id
 * Update division
 */
exports.updateDivision = async (req, res) => {
  const { id } = req.params;
  const { name, icon, member_count } = req.body;
  try {
    await db.execute(
      'UPDATE divisions SET name=?, icon=?, member_count=? WHERE id=?',
      [name, icon, member_count || 0, id]
    );
    return res.json({ success: true, message: 'Division updated' });
  } catch (err) {
    console.error('Error updating division:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/edit-home-pages/division/:id
 * Delete division
 */
exports.deleteDivision = async (req, res) => {
  const { id } = req.params;
  try {
    // Also delete all members of this division
    await db.execute('DELETE FROM member_division WHERE division_id=?', [id]);
    await db.execute('DELETE FROM divisions WHERE id=?', [id]);
    return res.json({ success: true, message: 'Division deleted' });
  } catch (err) {
    console.error('Error deleting division:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/edit-home-pages/division-member
 * Add member to a division
 */
exports.addMemberDivision = async (req, res) => {
  const { division_id, name, role, image_url } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO member_division (division_id, name, role, image_url) VALUES (?, ?, ?, ?)',
      [division_id, name, role, image_url || '']
    );
    return res.json({ success: true, message: 'Member added to division', id: result.insertId });
  } catch (err) {
    console.error('Error adding member division:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/edit-home-pages/division-member/:id
 * Edit member division by id
 */
exports.updateMemberDivision = async (req, res) => {
  const { id } = req.params;
  const { division_id, name, role, image_url } = req.body;
  try {
    await db.execute(
      'UPDATE member_division SET division_id=?, name=?, role=?, image_url=? WHERE id=?',
      [division_id, name, role, image_url || '', id]
    );
    return res.json({ success: true, message: 'Member division updated' });
  } catch (err) {
    console.error('Error updating member division:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/edit-home-pages/division-member/:id
 * Delete member division by id
 */
exports.deleteMemberDivision = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM member_division WHERE id=?', [id]);
    return res.json({ success: true, message: 'Member division deleted' });
  } catch (err) {
    console.error('Error deleting member division:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/edit-home-pages/division-member/:divisionId
 * Get all members by division
 */
exports.getDivisionMembers = async (req, res) => {
  const { divisionId } = req.params;
  try {
    const [members] = await db.execute(
      'SELECT * FROM member_division WHERE division_id=? ORDER BY id ASC',
      [divisionId]
    );
    return res.json({ success: true, data: members });
  } catch (err) {
    console.error('Error fetching members by division:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};