require('dotenv').config();
const express = require('express');
const path = require('path');

let uploadPictureRoute;
let uploadNpcPictureRoute;
let uploadDndPictureRoute;
let uploadDndNpcPictureRoute;
try {
  uploadPictureRoute = require(path.join(__dirname, 'public', 'SW_Pictures', 'api', 'upload-picture', 'index.cjs'));
  console.log('Upload picture route loaded successfully');
} catch (err) {
  console.error('Error loading upload picture route:', err.message);
  uploadPictureRoute = (req, res) => res.status(500).json({ error: 'Upload route not available' });
}

try {
  uploadNpcPictureRoute = require(path.join(__dirname, 'public', 'SW_Pictures', 'api', 'upload-npc-picture', 'index.cjs'));
  console.log('Upload NPC picture route loaded successfully');
} catch (err) {
  console.error('Error loading upload NPC picture route:', err.message);
  uploadNpcPictureRoute = (req, res) => res.status(500).json({ error: 'NPC upload route not available' });
}

try {
  uploadDndPictureRoute = require(path.join(__dirname, 'public', 'F_Pictures', 'api', 'upload-picture', 'index.cjs'));
  console.log('DND upload picture route loaded successfully');
} catch (err) {
  console.error('Error loading DND upload picture route:', err.message);
  uploadDndPictureRoute = (req, res) => res.status(500).json({ error: 'DND upload route not available' });
}

try {
  uploadDndNpcPictureRoute = require(path.join(__dirname, 'public', 'F_Pictures', 'api', 'upload-npc-picture', 'index.cjs'));
  console.log('DND NPC upload picture route loaded successfully');
} catch (err) {
  console.error('Error loading DND NPC upload picture route:', err.message);
  uploadDndNpcPictureRoute = (req, res) => res.status(500).json({ error: 'DND NPC upload route not available' });
}

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Register the upload picture API route BEFORE static files
console.log('Registering route: /SW_Pictures/api/upload-picture');
app.use('/SW_Pictures/api/upload-picture', uploadPictureRoute);
console.log('Route registered');
console.log('Registering route: /SW_Pictures/api/upload-npc-picture');
app.use('/SW_Pictures/api/upload-npc-picture', uploadNpcPictureRoute);
console.log('Route registered');
console.log('Registering route: /F_Pictures/api/upload-picture');
app.use('/F_Pictures/api/upload-picture', uploadDndPictureRoute);
console.log('Route registered');
console.log('Registering route: /F_Pictures/api/upload-npc-picture');
app.use('/F_Pictures/api/upload-npc-picture', uploadDndNpcPictureRoute);
console.log('Route registered');

const fs = require('fs');

// Serve static files (public assets only, not the React app)
app.use(express.static(path.join(__dirname, 'public')));

// Write timeline text to Feastlands_history_timeline.txt
app.post('/F_Pictures/api/write-timeline', (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text field' });
  }
  const filePath = path.join(__dirname, 'Feastlands_history_timeline.txt');
  try {
    fs.writeFileSync(filePath, text, 'utf8');
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed writing timeline:', err);
    res.status(500).json({ error: 'Failed to write file' });
  }
});

// Delete a SW note/NPC picture: clears PictureID and removes image file.
app.post('/SW_Pictures/api/delete-picture', async (req, res) => {
  const { pictureId, entityType, entityId } = req.body || {};

  const parsedPictureId = Number.parseInt(String(pictureId), 10);
  const parsedEntityId = Number.parseInt(String(entityId), 10);

  if (!Number.isInteger(parsedPictureId) || parsedPictureId <= 0) {
    return res.status(400).json({ error: 'Invalid pictureId' });
  }

  if (!Number.isInteger(parsedEntityId) || parsedEntityId <= 0) {
    return res.status(400).json({ error: 'Invalid entityId' });
  }

  if (entityType !== 'note' && entityType !== 'npc') {
    return res.status(400).json({ error: 'Invalid entityType' });
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const tableName = entityType === 'note' ? 'SW_campaign_notes' : 'SW_campaign_NPC';

    const { error: clearPictureError } = await supabase
      .from(tableName)
      .update({ PictureID: null })
      .eq('id', parsedEntityId);

    if (clearPictureError) {
      return res.status(500).json({ error: clearPictureError.message });
    }

    // Cleanup picture rows if they exist in either table.
    await supabase.from('SW_pictures').delete().eq('id', parsedPictureId);
    await supabase.from('DND_campaign_pictures').delete().eq('id', parsedPictureId);

    const picturePath = path.join(__dirname, 'public', 'SW_Pictures', `Picture ${parsedPictureId}.png`);
    if (fs.existsSync(picturePath)) {
      fs.unlinkSync(picturePath);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete SW picture:', err);
    return res.status(500).json({ error: 'Failed to delete picture' });
  }
});

// Global error handlers for debugging
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
