require('dotenv').config();
const express = require('express');
const path = require('path');

let uploadPictureRoute;
try {
  uploadPictureRoute = require(path.join(__dirname, 'public', 'SW_Pictures', 'api', 'upload-picture', 'index.cjs'));
  console.log('Upload picture route loaded successfully');
} catch (err) {
  console.error('Error loading upload picture route:', err.message);
  uploadPictureRoute = (req, res) => res.status(500).json({ error: 'Upload route not available' });
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

// Serve static files (public assets only, not the React app)
app.use(express.static(path.join(__dirname, 'public')));

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
