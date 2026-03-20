const express = require('express');
const path = require('path');
const { requireAuth } = require('../middlewares/auth');
const { uploadBufferToFilestack } = require('../utils/filestack');

const router = express.Router();

const ALLOWED_SCOPES = new Set(['products', 'blogs', 'avatars', 'reviews']);
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);

router.post(
  '/image',
  requireAuth,
  express.raw({ type: 'image/*', limit: '20mb' }),
  async (req, res) => {
    const scope = typeof req.query.scope === 'string' && ALLOWED_SCOPES.has(req.query.scope)
      ? req.query.scope
      : 'reviews';
    const contentType = req.headers['content-type'];
    const originalName = typeof req.headers['x-upload-filename'] === 'string'
      ? req.headers['x-upload-filename']
      : `upload-${Date.now()}.png`;

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return res.status(400).json({ message: 'Unsupported image type.' });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    const safeFilename = originalName
      .replace(/[^\w.-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    const filename = safeFilename.includes('.')
      ? safeFilename
      : `${safeFilename}${path.extname(originalName) || '.png'}`;

    try {
      const uploaded = await uploadBufferToFilestack({
        buffer: req.body,
        contentType,
        filename,
        pathPrefix: `${scope}/`
      });

      const url = uploaded.url || (uploaded.handle ? `https://cdn.filestackcontent.com/${uploaded.handle}` : '');
      if (!url) {
        return res.status(502).json({ message: 'Upload succeeded but no file URL was returned.' });
      }

      return res.status(201).json({
        url,
        handle: uploaded.handle || '',
        filename: uploaded.filename || filename,
        size: uploaded.size || req.body.length,
        mimetype: uploaded.mimetype || contentType
      });
    } catch (error) {
      console.error('Image upload failed:', error);
      return res.status(500).json({ message: error.message || 'Image upload failed.' });
    }
  }
);

module.exports = router;
