const mongoose = require('mongoose')
const chatRoomSchema = new mongoose.Schema({
    name: {
        type:String, 
        required: true,
        trim: true,
        maxlength: 50
    },
    participants:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
    }],     
    description: {
        type: String,
        trim: true,
        maxlength:200
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admins: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    isPublic: {
        type: Boolean,
        default: true
    },
}, {timestamps:true    
})

module.exports = mongoose.model('ChatRoom', chatRoomSchema);