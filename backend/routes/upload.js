const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const File = require('../models/File');

// Upload file endpoint
router.post('/file', auth, uploadSingle('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const file = new File({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: fileUrl,
            uploadedBy: req.user._id
        });

        await file.save();

        res.json({
            success: true,
            file: {
                _id: file._id,
                originalName: file.originalName,
                mimeType: file.mimeType,
                size: file.size,
                url: file.url
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;