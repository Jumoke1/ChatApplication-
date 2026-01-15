const express = require('express')
const router = express.Router();
const auth = require('../middleware/auth')
const message = require ('../models/Message')
const ChatRoom = require('../models/ChatRoom');

// Send a new message
router.post('/:roomName', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const { roomName } = req.params;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    //check if it is a dm room
       if (roomName.startsWith('dm_')) {
      // Handle as DM
      const dmPartnerId = roomName.replace('dm_', '');
      const dmPartner = await User.findById(dmPartnerId);
      
      if (!dmPartner) {
        return res.status(404).json({ message: 'DM partner not found' });
      }

      const newMessage = await Message.create({
        sender: req.user._id,
        content: content,
        isDM: true,
        dmRoomId: roomName,
        dmParticipants: [req.user._id, dmPartnerId]
        // chatRoom is NOT set for DMs
      });

      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'fullname email profilePhoto');

      return res.status(201).json({
        message: 'DM sent',
        data: populatedMessage,
      });
    }

    // ch
    const chatRoom = await ChatRoom.findOne({ name: roomName });
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const newMessage = await message.create({
      sender: req.user._id,
      chatRoom: chatRoom._id,
      content: content,
    });

    const populatedMessage = await message.findById(newMessage._id)
      .populate('sender', 'fullname email profilePhoto')  
      .populate('chatRoom', 'name');

    res.status(201).json({
      message: 'Message sent',
      data: populatedMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      succes:false,
      message:err.message
    });
  }
});


// Get message count in a room
router.get('/count/:roomName', auth, async (req, res) => {
  try {
    const { roomName } = req.params;
    
    // Find chat room by name first
    const chatRoom = await ChatRoom.findOne({ name: roomName });
    
    if (!chatRoom) {
      return res.status(404).json({ count: 0 });
    }

    const count = await message.countDocuments({ chatRoom: chatRoom._id });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching message count" });
  }
});


//get all messages in a room
router.get('/:roomName', auth, async (req, res) => {
  try {
    const { roomName } = req.params;
    
    // Find chat room by name first
    const chatRoom = await ChatRoom.findOne({ name: roomName });
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const messages = await message.find({ chatRoom: chatRoom._id })
      .populate('sender', 'fullname email profilePhoto')
      .populate('chatRoom', 'name')
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      data: messages
    });

  } catch (err) { 
    console.error(err)
    res.status(500).json({
      message: err.message
    });
  }
});
module.exports = router;