const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// send a direct message
router.post('/:dmRoomId', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const { dmRoomId } = req.params;
        
        console.log('DM POST:', { dmRoomId, content, userId: req.user._id });
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }
        
        // figure out who we're talking to based on the room id format
        let partnerId;
        
        if (dmRoomId.startsWith('dm_')) {
            const parts = dmRoomId.split('_');
            if (parts.length === 2) {
                // simple format: dm_userId
                partnerId = parts[1];
            } else if (parts.length === 3) {
                // two-user format: dm_user1_user2
                const id1 = parts[1];
                const id2 = parts[2];
                const currentUserId = req.user._id.toString();
                partnerId = (id1 === currentUserId) ? id2 : id1;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid DM room ID format'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'DM room ID must start with "dm_"'
            });
        }
        
        // make sure the person we're messaging actually exists
        const dmPartner = await User.findById(partnerId);
        if (!dmPartner) {
            return res.status(404).json({
                success: false,
                message: 'DM partner not found'
            });
        }
        
        const newMessage = await Message.create({
            sender: req.user._id,
            content: content,
            isDM: true,
            dmRoomId: dmRoomId,
            dmParticipants: [req.user._id, partnerId],
            read: false,
            status: 'sent'
        });
        
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'fullname email profilePhoto');
        
        res.status(201).json({
            success: true,
            message: 'DM sent',
            data: populatedMessage
        });
        
    } catch (error) {
        console.error(' DM POST Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// fetch all messages for a dm conversation
router.get('/:dmRoomId', auth, async (req, res) => {
    try {
        const { dmRoomId } = req.params;
        console.log(' DM GET:', dmRoomId);
        
        const messages = await Message.find({
            dmRoomId: dmRoomId,
            isDM: true
        })
        .populate('sender', 'fullname email profilePhoto')
        .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: messages.reverse() // newest at the bottom
        });
        
    } catch (error) {
        console.error(' DM GET Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get total message count for a dm room
router.get('/count/:dmRoomId', auth, async (req, res) => {
    try {
        const { dmRoomId } = req.params;
        
        const count = await Message.countDocuments({
            dmRoomId: dmRoomId,
            isDM: true
        });
        
        res.json({ count });
    } catch (error) {
        console.error('Error fetching DM count:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// mark all messages in a dm as read
router.post('/:dmRoomId/read', auth, async (req, res) => {
    try {
        const { dmRoomId } = req.params;
        const userId = req.user._id;

        // check if user is actually part of this conversation
        const hasMessage = await Message.findOne({
            dmRoomId: dmRoomId,
            dmParticipants: userId
        });

        if (!hasMessage) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        const result = await Message.updateMany(
            {
                dmRoomId: dmRoomId,
                isDM: true,
                read: false,
                sender: { $ne: userId }, // don't mark our own messages
                dmParticipants: userId
            },
            {
                $set: {
                    read: true,
                    readAt: new Date(),
                    status: 'seen'
                }
            }
        );

        res.json({
            success: true,
            message: 'DM messages marked as read',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error marking DM as read:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get count of unread dms for the current user
router.get('/unread/count', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        const unreadCount = await Message.countDocuments({
            isDM: true,
            read: false,
            sender: { $ne: userId },
            dmParticipants: userId
        });

        res.json({
            success: true,
            data: {
                dm: unreadCount,
                total: unreadCount
            }
        });

    } catch (error) {
        console.error('Error fetching unread DM count:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get detailed list of unread dms grouped by conversation
router.get('/unread/details', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        const unreadMessages = await Message.find({
            isDM: true,
            read: false,
            sender: { $ne: userId },
            dmParticipants: userId
        })
        .populate('sender', 'fullname email profilePhoto')
        .sort({ createdAt: -1 });

        // group messages by which dm room they belong to
        const roomMap = new Map();

        for (const msg of unreadMessages) {
            const roomId = msg.dmRoomId;
            
            if (!roomMap.has(roomId)) {
                let otherUserName = 'Unknown User';
                
                const otherParticipantId = msg.dmParticipants.find(
                    id => id.toString() !== userId.toString()
                );
                
                if (msg.sender && msg.sender._id.toString() === otherParticipantId?.toString()) {
                    otherUserName = msg.sender.fullname;
                } else if (otherParticipantId) {
                    const otherUser = await User.findById(otherParticipantId).select('fullname');
                    if (otherUser) {
                        otherUserName = otherUser.fullname;
                    }
                }
                
                roomMap.set(roomId, {
                    roomId: roomId,
                    count: 1,
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt,
                    userName: otherUserName
                });
            } else {
                const existing = roomMap.get(roomId);
                existing.count++;
                if (msg.createdAt > existing.lastMessageAt) {
                    existing.lastMessage = msg.content;
                    existing.lastMessageAt = msg.createdAt;
                }
            }
        }

        const unreadDMs = Array.from(roomMap.values());

        res.json({
            success: true,
            data: unreadDMs
        });

    } catch (error) {
        console.error('Error fetching unread DM details:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;