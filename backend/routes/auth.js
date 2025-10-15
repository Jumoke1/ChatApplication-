const express = require('express');
const router = express.Router();
const User = require('../models/User');
//for jwt auth
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({email})
        if (existingUser)  {
            return  res.status(400).json({error: 'User already exists'})
        }

        //hash password 
        const  hashedPassword = await bcrypt.hash(password, 12)

        const user = new User({ username, email, password:hashedPassword });
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
                username: user.username,
                email: user.email
             } });
    } catch (error) {
        res.status(400).json({error: error.message });
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
            return res.status(401).json({error:'Invalid credentials'})     
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
                username: user.username,
                email: user.email,
                online: user.online
             } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
