const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

    read:{
        type: Boolean,
        default: false 
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId, //object id is mongodb  unique identifier 
        ref: 'User', //ref create a relationship to the user model
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId, //mongose.Schema contains all the datatype mongoose supports
        ref: 'User',
        required: false
    },
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: false //  
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'], // enumuration it is a way to restrict a field to only accept specific predefined values
        default: 'text'
    },
     //  FIELDS FOR DMs:
    isDM: {
        type: Boolean,
        default: false
    },
    
    dmRoomId: {
        type: String,
        sparse: true  // Allows null/undefined, doesn't require unique if null
    },
    
    dmParticipants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
  
    },
     {timestamps:true}
    )
messageSchema.index({chatRoom:1, createdAt: -1})
messageSchema.index({ dmRoomId: 1, createdAt: -1 });
messageSchema.index({ isDM: 1 });
module.exports = mongoose.model('message', messageSchema)