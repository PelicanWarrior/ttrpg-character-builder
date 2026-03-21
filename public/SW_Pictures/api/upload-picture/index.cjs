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
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    next();
  });
};

const pictureDir = path.join(__dirname, '../../');

const getMaxPictureNumberFromDisk = () => {
  try {
    const entries = fs.readdirSync(pictureDir, { withFileTypes: true });
    let max = 0;

    entries.forEach((entry) => {
      if (!entry.isFile()) return;
      const match = /^Picture\s+(\d+)\.png$/i.exec(entry.name);
      if (!match) return;
      const parsed = Number.parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) {
        max = Math.max(max, parsed);
      }
    });

    return max;
  } catch {
    return 0;
  }
};

const getMaxIdFromTable = async (tableName) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .order('id', { ascending: false })
    .limit(1);

  if (error || !Array.isArray(data) || data.length === 0) return 0;
  return Number(data[0]?.id) || 0;
};

const getNextPictureId = async () => {
  const [diskMax, dndMax, swMax] = await Promise.all([
    Promise.resolve(getMaxPictureNumberFromDisk()),
    getMaxIdFromTable('DND_campaign_pictures'),
    getMaxIdFromTable('SW_pictures'),
  ]);

  return Math.max(diskMax, dndMax, swMax) + 1;
};

const createPictureRow = async (userId, desiredId) => {
  const swInsert = await supabase
    .from('SW_pictures')
    .insert([{ id: desiredId, user_ID: userId }])
    .select('id')
    .single();

  if (!swInsert.error && swInsert.data?.id != null) {
    return swInsert.data.id;
  }

  const fallbackInsert = await supabase
    .from('DND_campaign_pictures')
    .insert([{ id: desiredId, user_ID: userId }])
    .select('id')
    .single();

  if (fallbackInsert.error) {
    throw fallbackInsert.error;
  }
  return fallbackInsert.data.id;
};

router.post('/', handleMulterError, async (req, res) => {
  try {
    const { placeId, userId } = req.body;
    if (!req.file || !placeId || !userId) {
      return res.status(400).json({ error: 'Missing file, placeId, or userId' });
    }

    const nextPictureId = await getNextPictureId();
    const pictureId = await createPictureRow(userId, nextPictureId);

    const newPath = path.join(req.file.destination, `Picture ${pictureId}.png`);
    fs.renameSync(req.file.path, newPath);

    const { error: updateError } = await supabase
      .from('SW_campaign_notes')
      .update({ PictureID: pictureId })
      .eq('id', placeId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ success: true, pictureId });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unknown error occurred' });
  }
});

module.exports = router;
