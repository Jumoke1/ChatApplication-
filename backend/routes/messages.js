const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

// send a message to a channel
router.post('/:roomId', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const { roomId } = req.params;
        
        console.log('📨 Channel POST:', { roomId, content, userId: req.user._id });
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }
        
        // make sure the channel actually exists
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }
        
        const newMessage = await Message.create({
            sender: req.user._id,
            chatRoom: roomId,
            content: content,
            isDM: false,
            read: false,
            status: 'sent'
        });
        
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'fullname email profilePhoto')
            .populate('chatRoom', 'name');
        
        res.status(201).json({
            success: true,
            message: 'Message sent',
            data: populatedMessage
        });
        
    } catch (error) {
        console.error('❌ Channel POST Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get all messages from a channel
router.get('/:roomId', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        console.log('📨 Channel GET:', roomId);
        
        const messages = await Message.find({
            chatRoom: roomId,
            isDM: false
        })
        .populate('sender', 'fullname email profilePhoto')
        .populate('chatRoom', 'name')
        .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: messages.reverse() // show oldest first
        });
        
    } catch (error) {
        console.error('❌ Channel GET Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// count how many messages in a channel
router.get('/count/:roomId', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        
        const count = await Message.countDocuments({
            chatRoom: roomId,
            isDM: false
        });
        
        res.json({ count });
    } catch (error) {
        console.error('Error fetching message count:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// mark all messages in a channel as read
router.post('/:channelId/read', auth, async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.user._id;

        // check if user is actually in this channel
        const channel = await ChatRoom.findOne({
            _id: channelId,
            participants: userId
        });

        if (!channel) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this channel'
            });
        }

        const result = await Message.updateMany(
            {
                chatRoom: channelId,
                isDM: false,
                read: false,
                sender: { $ne: userId } // don't mark our own messages
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
            message: 'Channel messages marked as read',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error marking channel as read:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get total unread message count across all channels
router.get('/unread/count', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        const userChannels = await ChatRoom.find({ participants: userId }).distinct('_id');
        
        const unreadCount = await Message.countDocuments({
            chatRoom: { $in: userChannels },
            isDM: false,
            read: false,
            sender: { $ne: userId }
        });

        res.json({
            success: true,
            data: {
                channels: unreadCount,
                total: unreadCount
            }
        });

    } catch (error) {
        console.error('Error fetching unread channel count:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get detailed list of unread messages per channel
router.get('/unread/details', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        const userChannels = await ChatRoom.find(
            { participants: userId },
            { name: 1, _id: 1 }
        );

        if (userChannels.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const unreadChannels = await Message.aggregate([
            {
                $match: {
                    chatRoom: { $in: userChannels.map(c => c._id) },
                    isDM: false,
                    read: false,
                    sender: { $ne: userId }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$chatRoom',
                    count: { $sum: 1 },
                    lastMessage: { $first: '$content' },
                    lastMessageAt: { $first: '$createdAt' },
                    lastSender: { $first: '$sender' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'lastSender',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
            },
            {
                $lookup: {
                    from: 'chatrooms',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'roomInfo'
                }
            },
            {
                $project: {
                    roomId: '$_id',
                    count: 1,
                    lastMessage: 1,
                    lastMessageAt: 1,
                    name: { $arrayElemAt: ['$roomInfo.name', 0] },
                    senderName: { $arrayElemAt: ['$senderInfo.fullname', 0] },
                    senderId: { $arrayElemAt: ['$lastSender', 0] }
                }
            }
        ]);

        res.json({
            success: true,
            data: unreadChannels
        });

    } catch (error) {
        console.error('Error fetching unread channel details:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// mark all messages in every channel as read at once
router.post('/read-all', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        const userChannels = await ChatRoom.find({ participants: userId }).distinct('_id');

        if (userChannels.length === 0) {
            return res.json({
                success: true,
                message: 'No channels to mark as read',
                modifiedCount: 0
            });
        }

        const result = await Message.updateMany(
            {
                chatRoom: { $in: userChannels },
                isDM: false,
                read: false,
                sender: { $ne: userId }
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
            message: 'All channel messages marked as read',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error marking all channels as read:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;