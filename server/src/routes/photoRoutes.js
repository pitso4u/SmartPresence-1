const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const { logger } = require('../utils/logger');

// Upload photo endpoint
router.post('/upload', upload.single('photo'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Return the file path that can be stored in the database
    const photoPath = req.file.path;
    
    logger.info(`Photo uploaded successfully: ${req.file.filename}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Photo uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: photoPath,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    logger.error('Error in photo upload:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload photo'
    });
  }
});

// Serve photos endpoint
router.get('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const photoPath = require('path').join(__dirname, '../../uploads/photos', filename);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({
        status: 'error',
        message: 'Photo not found'
      });
    }
    
    res.sendFile(photoPath);
  } catch (error) {
    logger.error('Error serving photo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to serve photo'
    });
  }
});

module.exports = router; 