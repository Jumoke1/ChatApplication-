const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Chat room name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Room name must be at least 2 characters'],
        maxlength: [50, 'Room name cannot exceed 50 characters']
    },
    description: {
        type: String,
        maxlength: [200, 'Description cannot exceed 200 characters'],
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for faster queries
chatRoomSchema.index({ name: 1 });
chatRoomSchema.index({ participants: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);