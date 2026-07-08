const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload'); // ✅ Fix: Import upload properly

// Register
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }
        
        // Create new user
        const user = new User({
            fullname,
            email,
            password
        });
        
        await user.save();
        
        // Create token
        const token = jwt.sign(
            { userId: user._id, id: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                profilePhoto: user.profilePhoto,
                online: user.online,
                lastSeen: user.lastSeen
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        // Update last seen
        user.lastSeen = new Date();
        await user.save();
        
        // Create token
        const token = jwt.sign(
            { userId: user._id, id: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                profilePhoto: user.profilePhoto,
                online: user.online,
                lastSeen: user.lastSeen
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// ✅ FIXED: Upload profile photo
router.put("/profile-photo", auth, uploadSingle('profile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }
        
        const profilePhotoUrl = `/uploads/${req.file.filename}`;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { profilePhoto: profilePhotoUrl },
            { new: true, select: 'fullname email profilePhoto online lastSeen' }
        );
        
        res.json({
            success: true,
            message: 'Profile photo updated successfully',
            data: {
                profilePhoto: profilePhotoUrl,
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Profile photo upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                fullname: req.user.fullname,
                email: req.user.email,
                profilePhoto: req.user.profilePhoto,
                online: req.user.online,
                lastSeen: req.user.lastSeen
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Update user profile (without photo)
router.put('/profile', auth, async (req, res) => {
    try {
        const { fullname } = req.body;
        
        if (!fullname) {
            return res.status(400).json({ 
                success: false,
                message: 'Full name is required' 
            });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { fullname },
            { new: true, select: 'fullname email profilePhoto online lastSeen' }
        );
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Logout (optional - just for tracking)
router.post('/logout', auth, async (req, res) => {
    try {
        // Update user status
        await User.findByIdAndUpdate(req.user._id, {
            online: false,
            lastSeen: new Date()
        });
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

module.exports = router;