
const express = require('express')
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');


router.get('/', auth, async (req, res)=> {
    try{
        console.log('Fetching all users. Current user  ID:', req.user._id);

        //fetch  all user 
        const users = await User.find(
            {
                _id: { $ne: req.user._id } },
                'fullname email profilePhoto online lastSeen'
            
        ).sort({ fullname: 1});
        console.log(`Found ${users.length} users`)
        
        res.json({
          success: true,
          count: users.length,
          data: users
        })
    }catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users',
            error: error.message
        })
    }

});


// GET SINGLE USER BY ID (for user profiles)
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user by ID
    const user = await User.findById(
      userId, 
      'fullname email profilePhoto online lastSeen createdAt'
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
});

//  SEARCH USERS ( for better search functionality)
router.get('/search/:keyword', auth, async (req, res) => {
  try {
    const { keyword } = req.params;
    
    // Search users by name or email
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { fullname: { $regex: keyword, $options: 'i' } }, // 'i' = case insensitive
            { email: { $regex: keyword, $options: 'i' } }
          ]
        }
      ]
    }, 'fullname email profilePhoto online').limit(50); // Limit results
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    console.error('❌ Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
});

//  UPDATE USER PROFILE (optional)
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullname, profilePhoto } = req.body;
    const updates = {};
    
    if (fullname) updates.fullname = fullname;
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, select: 'fullname email profilePhoto online lastSeen' }
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

module.exports = router;

