const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG files allowed'));
    }
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer error handler wrapper
const handleMulterError = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    next();
  });
};

router.post('/', handleMulterError, async (req, res) => {
  try {
    console.log('=== NPC Upload request received ===');
    console.log('File present:', !!req.file);
    if (req.file) {
      console.log('File details:', {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
    }
    console.log('Body:', req.body);

    const { npcId, userId } = req.body;
    console.log('Extracted npcId:', npcId, 'userId:', userId);

    if (!req.file || !npcId || !userId) {
      console.log('Missing data - file:', !!req.file, 'npcId:', npcId, 'userId:', userId);
      return res.status(400).json({ error: 'Missing file, npcId, or userId' });
    }

    console.log('Step 1: Inserting into SW_pictures...');
    // Insert into SW_pictures and get new id
    const { data, error } = await supabase
      .from('SW_pictures')
      .insert([{ user_ID: userId }])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Insert failed: ' + error.message });
    }
    const pictureId = data.id;
    console.log('Step 1 complete. Picture ID:', pictureId);

    console.log('Step 2: Renaming file...');
    // Rename file to Picture <ID>.png
    const newPath = path.join(req.file.destination, `Picture ${pictureId}.png`);
    console.log('Renaming from:', req.file.path, 'to:', newPath);
    fs.renameSync(req.file.path, newPath);
    console.log('Step 2 complete.');

    console.log('Step 3: Updating SW_campaign_NPC...');
    // Update SW_campaign_NPC with new PictureID
    const { error: updateError } = await supabase
      .from('SW_campaign_NPC')
      .update({ PictureID: pictureId })
      .eq('id', npcId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({ error: 'Update failed: ' + updateError.message });
    }
    console.log('Step 3 complete.');

    console.log('NPC picture upload successful:', { npcId, pictureId });
    res.json({ success: true, pictureId });
  } catch (err) {
    console.error('NPC Upload error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message || 'Unknown error occurred' });
  }
});

module.exports = router;

