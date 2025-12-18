require('dotenv').config();
const express = require('express');
const path = require('path');
const uploadPictureRoute = require(path.join(__dirname, 'public', 'SW_Pictures', 'api', 'upload-picture.cjs'));

const app = express();

// Serve static files (your React app and public assets)
app.use(express.static(path.join(__dirname, 'public')));

// Register the upload picture API route
app.use('/SW_Pictures/api/upload-picture', uploadPictureRoute);

// Fallback to index.html for React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handlers for debugging
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
