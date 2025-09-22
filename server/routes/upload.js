const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middlewares/authMiddleware');

// Simple disk storage to a temp uploads folder inside server/uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

// POST /api/upload
router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Return a local file URL that client can open during dev. In prod, serve /uploads statically or move to a CDN.
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl, name: req.file.originalname, type: req.file.mimetype, size: req.file.size });
});

module.exports = router;
