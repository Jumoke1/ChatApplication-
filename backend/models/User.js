const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true,
        minlength:3,
        maxlength:30
    },
    email:{
        type:String, 
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type: String,
        required: true,
        minlength: 6
    },

    online: {
        type: Boolean,
        default: false 
    },

    lastSeen: {
        type: Date,
        default: Date.now

    }, 
    profilePhoto: {
    type: String,
    default: ""
    },

}, { 
  timestamps: true  //  Automatically adds:
                    // createdAt: when user registered
                    // updatedAt: when user last updated
})
module.exports = mongoose.model('User', userSchema);