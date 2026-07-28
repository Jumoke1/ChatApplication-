// const ChatRoom = require('../models/ChatRoom');

// //create  new channel 
// exports.createChatRoom = async(req, res)=> {
//   try {
//     console.log('creating chat room with data:', req.body);
//     console.log(' User ID from auth:', req.user?._id || req.user?.id);

//     const {name, description, participants = []} = req.body
//     const createdBy = req.user?._id

//     if (!name) {
//       return res.status(400).json({
//         success:false,
//         message: "Channel name is required"
//       });
//     }

//      if (!createdBy) {
//         return res.status(401).json({
//             success: false,
//             message: "Authentication required"
//         });
//      }

//       // Validate name format (lowercase, hyphens, numbers)
//     const nameRegex = /^[a-z0-9-]+$/;
//     if (!nameRegex.test(name)) {
//       return res.status(400).json({
//         success: false,
//         message: "Channel name can only contain lowercase letters, numbers, and hyphens"
//       });
//     }

//      //check if channel name already exist 
//      const existingChannel = await ChatRoom.findOne({name: name.toLowerCase() 
//      });
//        if (existingChannel) {
//          return res.status(409).json({
//             success: false,
//             message:`Channel '${name}' already exist`
//          });
//        }


//        //create the ne chat roomchannel 
//        const newChatRoom = new ChatRoom({
//         name: name.toLowerCase(),
//         description: description || '',
//         createdBy, 
//         participants: [... new Set([createdBy, ...participants])],
//         admins: [createdBy], // Creator is admin
//         isPublic: req.body.isPublic !== false    
//     });

//        await newChatRoom.save();

//        //populate user
//        const populatedRoom = await ChatRoom.findById(newChatRoom._id)
//             .populate('createdBy', 'fullname email profilePhoto')
//             .populate('participants', 'fullname email profilePhoto')
//             .populate('admins', 'fullname email profilePhoto')

//         console.log('Chat room created:', populatedRoom.name)

//         res.status(201).json({
//             success: true,
//             message: "Channel created successfully",
//             data: populatedRoom
//         })

//      } catch (error) {
//        console.error("Chat room creatio error:", error);

//         if (error.code === 11000) {
//           return res.status(400).json({
//             success: false,
//             message: "Channel name already exists"
//           });
//         }

//         res.status(500).json({
//             success: false,
//             message: "server error creating channel",
//             error: process.env.NODE_ENV === "development"? error.message : undefined
//         })

//   }
// }

// exports.getChatRooms = async (req, res) => {
//   try {
//     const userId = req.user._id;
    
//     // Show ALL public channels + channels user has access to
//     const rooms = await ChatRoom.find({
//       $or: [
//         { isPublic: true },                 // All public channels (including general)
//         { participants: userId },           // Private channels user joined
//         { createdBy: userId },              // Channels user created
//         { name: 'general' }                // general
//       ]
//     })
//     .populate('createdBy', 'fullname email profilePhoto')
//     .populate('participants', 'fullname email profilePhoto')
//     .populate('admins', 'fullname email profilePhoto')
//     .sort({ createdAt: -1 });

//     console.log(`Returning ${rooms.length} channels:`, rooms.map(r => r.name));
//     res.json(rooms);

//   } catch (error) {
//     console.error(" Get chat rooms error:", error);
//     res.status(500).json([]);
//   }
// };