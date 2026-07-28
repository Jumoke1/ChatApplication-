const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// set up file upload for profile pictures
const uploadDir = path.join(__dirname, '../uploads/profile-photos');

// make sure the folder exists before trying to save files
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(' Created upload directory:', uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + req.user._id + '-' + uniqueSuffix + ext);
    }
});

// only allow image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5mb max
    fileFilter: fileFilter
});

// get all users except the current one
router.get('/', auth, async (req, res, next) => {
    try {
        console.log(' Fetching all users. Current user ID:', req.user._id);

        const users = await User.find(
            { _id: { $ne: req.user._id } },
            'fullname email profilePhoto online lastSeen'
        ).sort({ fullname: 1 });
        
        console.log(` Found ${users.length} users`);
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
});

// get a single user by their id
router.get('/:userId', auth, async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            const error = new Error('Invalid user ID format');
            error.statusCode = 400;
            throw error;
        }
        
        const user = await User.findById(
            userId, 
            'fullname email profilePhoto online lastSeen createdAt'
        );
        
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// search for users by name or email
router.get('/search/:keyword', auth, async (req, res, next) => {
    try {
        const { keyword } = req.params;
        
        if (!keyword || keyword.trim() === '') {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }
        
        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } },
                {
                    $or: [
                        { fullname: { $regex: keyword, $options: 'i' } },
                        { email: { $regex: keyword, $options: 'i' } }
                    ]
                }
            ]
        }, 'fullname email profilePhoto online')
        .limit(50)
        .sort({ fullname: 1 });
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
});

// update user's display name or other profile info
router.put('/profile', auth, async (req, res, next) => {
    try {
        const { fullname, profilePhoto } = req.body;
        
        if (!fullname && profilePhoto === undefined) {
            const error = new Error('No fields to update');
            error.statusCode = 400;
            throw error;
        }
        
        const updates = {};
        if (fullname) {
            if (fullname.length < 2) {
                const error = new Error('Name must be at least 2 characters');
                error.statusCode = 400;
                throw error;
            }
            if (fullname.length > 50) {
                const error = new Error('Name cannot exceed 50 characters');
                error.statusCode = 400;
                throw error;
            }
            updates.fullname = fullname;
        }
        if (profilePhoto !== undefined) {
            updates.profilePhoto = profilePhoto;
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true, select: 'fullname email profilePhoto online lastSeen' }
        );
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
});

// toggle user's online/offline status
router.put('/status', auth, async (req, res, next) => {
    try {
        const { online } = req.body;
        
        if (typeof online !== 'boolean') {
            const error = new Error('Online status must be a boolean');
            error.statusCode = 400;
            throw error;
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { 
                $set: { 
                    online: online,
                    lastSeen: new Date()
                } 
            },
            { new: true, select: 'fullname email profilePhoto online lastSeen' }
        );
        
        res.json({
            success: true,
            message: online ? 'User is now online' : 'User is now offline',
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
});

// get the current user's own profile data
router.get('/me/profile', auth, async (req, res, next) => {
    try {
        const user = await User.findById(
            req.user._id,
            'fullname email profilePhoto online lastSeen createdAt'
        );
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// upload a new profile picture
router.put('/profile-photo', auth, upload.single('profilePhoto'), async (req, res, next) => {
    try {
        console.log(' Uploading profile photo...');
        console.log(' File:', req.file);
        
        if (!req.file) {
            const error = new Error('No file uploaded');
            error.statusCode = 400;
            throw error;
        }
        
        // grab the old photo so we can delete it
        const oldUser = await User.findById(req.user._id);
        const oldPhoto = oldUser.profilePhoto;
        
        // remove the old file if it exists and isn't the default avatar
        if (oldPhoto && oldPhoto !== '/uploads/default-avatar.png') {
            const oldPhotoPath = path.join(__dirname, '..', oldPhoto);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
                console.log(' Deleted old profile photo:', oldPhoto);
            }
        }
        
        const profilePhotoUrl = `/uploads/profile-photos/${req.file.filename}`;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { profilePhoto: profilePhotoUrl } },
            { new: true, select: 'fullname email profilePhoto online lastSeen' }
        );
        
        console.log(' Profile photo uploaded successfully:', profilePhotoUrl);
        
        res.json({
            success: true,
            message: 'Profile photo updated successfully',
            profilePhoto: profilePhotoUrl,
            data: updatedUser
        });
    } catch (error) {
        console.error(' Error uploading profile photo:', error.message);
        // clean up the uploaded file if something went wrong
        if (req.file) {
            const filePath = path.join(uploadDir, req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        next(error);
    }
});

// delete the user's profile picture entirely
router.delete('/profile-photo', auth, async (req, res, next) => {
    try {
        console.log(' Removing profile photo...');
        
        const user = await User.findById(req.user._id);
        
        if (user.profilePhoto) {
            const photoPath = path.join(__dirname, '..', user.profilePhoto);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
                console.log(' Deleted profile photo file:', user.profilePhoto);
            }
            
            await User.findByIdAndUpdate(
                req.user._id,
                { $set: { profilePhoto: null } },
                { new: true }
            );
        }
        
        console.log(' Profile photo removed successfully');
        
        res.json({
            success: true,
            message: 'Profile photo removed successfully'
        });
    } catch (error) {
        console.error(' Error removing profile photo:', error.message);
        next(error);
    }
});

module.exports = router;