const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../../public/SW_Pictures/'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') cb(null, true);
    else cb(new Error('Only PNG files allowed'), false);
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { placeId, userId } = req.body;
    if (!req.file || !placeId || !userId) {
      return res.status(400).json({ error: 'Missing file, placeId, or userId' });
    }

    // Insert into SW_pictures and get new id
    const { data, error } = await supabase
      .from('SW_pictures')
      .insert([{ user_ID: userId }])
      .select('id')
      .single();

    if (error) throw error;
    const pictureId = data.id;

    // Rename file to Picture<ID>.png
    const newPath = path.join(req.file.destination, `Picture${pictureId}.png`);
    fs.renameSync(req.file.path, newPath);

    // Update SW_campaign_notes with new PictureID
    const { error: updateError } = await supabase
      .from('SW_campaign_notes')
      .update({ PictureID: pictureId })
      .eq('id', placeId);

    if (updateError) throw updateError;

    res.json({ success: true, pictureId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
