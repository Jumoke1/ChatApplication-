const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // Basic message info
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    
    // Sender
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Message type
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    },
    
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    
    readAt: {
        type: Date
    },
    // For channel messages
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: function() { return !this.isDM; } // Required if NOT DM
    },
    
    // For DM messages
    isDM: {
        type: Boolean,
        default: false
    },
    
    file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
    },
     
    dmRoomId: {
        type: String,
        sparse: true,
        required: function() { return this.isDM; } // Required if DM
    },
    
    dmParticipants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // File attachments
    attachments: [{
        filename: String,
        url: String,
        fileType: String,
        size: Number
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    editedAt: {
        type: Date
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for faster queries
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ dmRoomId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ isDM: 1 });

// Virtual for other participant (useful for DMs)
messageSchema.virtual('otherParticipant').get(function() {
    if (!this.isDM || !this.dmParticipants || this.dmParticipants.length < 2) {
        return null;
    }
    const currentUserId = this.sender;
    return this.dmParticipants.find(p => p.toString() !== currentUserId.toString());
});

// Method to mark as delivered
messageSchema.methods.markSeen = function() {
    if (this.status !== 'seen') {
        this.status = 'seen';
        this.read = true;
        this.readAt = new Date();
        return this.save();
    }
    return this;
};

// mark as read
messageSchema.methods.markAsRead = function() {
    if (!this.read) {
        this.read = true;
        this.readAt = new Date();
        if (this.status !== 'seen') {
            this.status = 'seen';
        }
        return this.save();
    }
    return this;
};

module.exports = mongoose.model('Message', messageSchema);