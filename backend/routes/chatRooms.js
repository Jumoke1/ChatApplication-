const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');

// Create a chat room
router.post('/', async (req, res) => {
    try {
        const chatRoom = new ChatRoom(req.body);
        await chatRoom.save();
        res.status(201).json(chatRoom);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all chat rooms
router.get('/', async (req, res) => {
    try {
        const chatRooms = await ChatRoom.find()
            .populate('participants', 'username')
            .populate('createdBy', 'username');
        res.json(chatRooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
