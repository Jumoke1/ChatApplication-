const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// Send a DM message
router.post('/:dmRoomId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const { dmRoomId } = req.params; // e.g., "dm_user1_user2" or "dm_userId"

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Extract user IDs from DM room ID
    // Format could be: "dm_user1_user2" or "dm_userId"
    const dmPartnerId = dmRoomId.replace('dm_', '');
    
    // Validate the other user exists
    const dmPartner = await User.findById(dmPartnerId);
    if (!dmPartner) {
      return res.status(404).json({ message: 'DM partner not found' });
    }

    // Create DM message (no chatRoom reference)
    const newMessage = await Message.create({
      sender: req.user._id,
      content: content,
      isDM: true,
      dmRoomId: dmRoomId, // Store the DM room ID
      dmParticipants: [req.user._id, dmPartnerId] // Both users in DM
    });

    // Populate sender info
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'fullname email profilePhoto');

    res.status(201).json({
      message: 'DM sent',
      data: populatedMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: err.message
    });
  }
});

// Get DM messages for a DM room
router.get('/:dmRoomId', auth, async (req, res) => {
  try {
    const { dmRoomId } = req.params;

    // Get all messages for this DM room
    const messages = await Message.find({ 
      dmRoomId: dmRoomId,
      isDM: true 
    })
      .populate('sender', 'fullname email profilePhoto')
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      data: messages
    });

  } catch (err) { 
    console.error(err);
    res.status(500).json({
      message: err.message
    });
  }
});

// Get DM count
router.get('/count/:dmRoomId', auth, async (req, res) => {
  try {
    const { dmRoomId } = req.params;
    
    const count = await Message.countDocuments({ 
      dmRoomId: dmRoomId,
      isDM: true 
    });
    
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching DM count" });
  }
});

module.exports = router;