const express = require('express');
const router = express.Router();
const User = require('../models/User');
//for jwt auth
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const upload = require('../middleware/upload');
const auth = require("../middleware/auth")
const Message = require('../models/Message')

//upload profile photo
router.put("/profile-photo", auth, upload.single("profile"), async (req, res) =>  {
    try { 
        const imagePath = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {profilePhoto: imagePath },
            {new: true}
        );
        res.json({success: true, user});
    }catch(err) {
       res.status(500).json({message: "upload failed"})
    }
})

// Register
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, password  } = req.body;
        const existingUser = await User.findOne({email})
        if (existingUser)  {
            return  res.status(400).json({error: 'User already exists'})
        }

        //hash password 
        const  hashedPassword = await bcrypt.hash(password, 12)

        const user = new User({ fullname, email, password:hashedPassword});
        await user.save();

        //create token 
        const token = jwt.sign(
            {
                userId: user._id},
                process.env.JWT_SECRET || 'your-secret-key',
                {expiresIn:'7d'}
            
        )
        res.status(201).json({ message: 'User created Successfully',
            token,
             user:{id: user._id,
                fullname: user.fullname,
                email: user.email
             } });

    } catch (error) {
        res.status(400).json({message: error.message });
    }
});


// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        //get user
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        //check password 
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({message:'Invalid credentials'})     
           }

           //create token
           const token = jwt.sign(
            {userId:user._id},
            process.env.JWT_SECRET ||'your-secret-key',
            {expiresIn:'7d'}
           );

           //update user online status 
           user.online = true;
           user.lastSeen = new Date();
           await user.save()

        res.json({ message: 'Login successful',
            token,
             user:{
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                online: user.online,
                profilePhoto:user.profilePhoto
             } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

    


module.exports = router;
