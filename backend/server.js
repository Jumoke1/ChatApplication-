const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http')
const PORT = process.env.PORT || 5001;
const auth = require('./middleware/auth');

//import routes 
const Message = require('./models/Message')
const ChatRoom = require('./models/ChatRoom')
const messageRoutes = require('./routes/messages');
const chatRoomRoutes = require('./routes/chatRooms');
const userRoutes = require('./routes/user');
const dmMessageRoutes = require('./routes/dmMessages');
app.use("/uploads", express.static("uploads"));

//import mongoose Library and connect it
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/chat-app')
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDb Error', err))


//socket.io setup  // WebSocket Connection Management it  Handles client connections/disconnections
//cors:  Allows frontend React app to connect
//Realtime Event Handling: Listens for and emits events in real-time

const server = http.createServer(app);
const socketIo = require('socket.io')
const io = socketIo(server,{
    cors:{
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
//End of socketio setup


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



//Import routes
const authRoutes = require('./routes/auth');

app.use('/api/users', require('./routes/user'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/auth', authRoutes);
app.use('/api/chatrooms', chatRoomRoutes);
app.use('/api/dmmessages', dmMessageRoutes);


//Socket.io Events ...fires when client connect to your server with ther unique ifd
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    //Join a chat room ... user added to the chat room and receive message 
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId)
        console.log(`User ${socket.id} joined room: ${roomId}`)
    })

        // Leave a chat room
    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room: ${roomId}`);
    });

    
    //send message  and save message to datatbase 
     socket.on('sendMessage', async (data) => {
        console.log("sendMessage received:", data)
        try {
            const message = new Message({
            sender: data.sender?.id || data.sender?._id || data.sender,
            chatRoom: data.chatRoom || data.room, 
            content: data.content,
            createdAt: data.createdAt || new Date()
        });
     
     
     
     
       await message.save();

            //get sender's username 
            await message.populate('sender', 'fullname email profilePhoto');

            await message.populate('chatRoom', 'name');

            //send to everyone in the room  and include sender's details 
            const roomId = message.chatRoom?.name || message.chatRoom?._id || data.room || data.chatRoom;
              io.to(roomId).emit('newMessage', message);
        
            console.log(`📢 Message broadcast to room ${roomId}: ${message.content}`);
    
        
            } catch (error) {
                socket.emit('error', error.message)
            }
            
        })

        //Typing indicator 
        socket.on('typing', (data)=> {
            socket.to(data.chatRoom).emit('userTyping', {
                userId: data.userId,
                username: data.username,
                isTyping: data.isTyping
            })
        })

        // track when the client disconnet or close their browser
        socket.on('disconnect',() => {
            console.log('User disconnected:', socket.id);
        })
})



 

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working! 🚀',
        timestamp: new Date().toISOString()
    });
});

// Home route
app.get('/', (req, res) => {
    res.send(`
        <h1>✅ Server is Running!</h1>
        <p>Test the API: <a href="/api/test">/api/test</a></p>
    `);
});


app.get('/api/protected', auth, (req,res)=> {
    res.json ({
        message:'You accessed a protected route',
        user:req.user
    })

})
// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Test: http://localhost:${PORT}/api/test`);
});