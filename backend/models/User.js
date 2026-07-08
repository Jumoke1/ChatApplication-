const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    profilePhoto: {
        type: String,
        default: null
    },

    online: {
        type: Boolean,
        default: false
    },

    lastSeen: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});


// HASH PASSWORD BEFORE SAVING
UserSchema.pre('save', async function(next) {

    // only hash if password changed
    if (!this.isModified('password')) {
        return next();
    }

    try {

        const salt = await bcrypt.genSalt(10);

        this.password = await bcrypt.hash(this.password, salt);

        next();

    } catch (error) {
        next(error);
    }
});


// COMPARE PASSWORD METHOD
UserSchema.methods.comparePassword = async function(enteredPassword) {

    return await bcrypt.compare(
        enteredPassword,
        this.password
    );
};

module.exports = mongoose.model('User', UserSchema);