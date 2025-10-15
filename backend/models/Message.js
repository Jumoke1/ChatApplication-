const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

    Read:{
        type: Boolean,
        default: false 
    },
    Sender: {
        type: mongoose.Schema.Types.ObjectId, //object id is mongodb  unique identifier 
        ref: 'User', //ref create a relationship to the user model
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId, //mongose.Schema contains all the datatype mongoose supports
        ref: 'User',
        required: true
    },
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true  //  
    },
    Content: {
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
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom'
    }
    },
     {timestamps:true

})
messageSchema.index({chatRoom:1, createdAt: -1})
module.export = mongoose.model('message', messageSchema)