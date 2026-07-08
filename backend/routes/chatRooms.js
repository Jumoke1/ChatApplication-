const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

// Get all chat rooms
router.get('/', auth, async (req, res) => {
    try {
        const chatRooms = await ChatRoom.find();
        res.json({
            success: true,
            data: chatRooms
        });
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get a specific chat room by ID
router.get('/:roomId', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const chatRoom = await ChatRoom.findById(roomId);
        
        if (!chatRoom) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }
        
        res.json({
            success: true,
            data: chatRoom
        });
    } catch (error) {
        console.error('Error fetching chat room:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create a new chat room
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        
        const existingRoom = await ChatRoom.findOne({ name });
        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: 'Chat room already exists'
            });
        }
        
        const chatRoom = new ChatRoom({
            name,
            description,
            createdBy: req.user._id,
            participants: [req.user._id]
        });
        
        await chatRoom.save();
        
        res.status(201).json({
            success: true,
            data: chatRoom
        });
    } catch (error) {
        console.error('Error creating chat room:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Join a chat room
router.post('/:roomId/join', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const chatRoom = await ChatRoom.findById(roomId);
        
        if (!chatRoom) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }
        
        if (!chatRoom.participants.includes(req.user._id)) {
            chatRoom.participants.push(req.user._id);
            await chatRoom.save();
        }
        
        res.json({
            success: true,
            data: chatRoom
        });
    } catch (error) {
        console.error('Error joining chat room:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get room participants
router.get('/:roomId/participants', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const chatRoom = await ChatRoom.findById(roomId).populate('participants', 'fullname email profilePhoto');
        
        if (!chatRoom) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }
        
        res.json({
            success: true,
            data: chatRoom.participants
        });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;