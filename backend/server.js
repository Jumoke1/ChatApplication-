const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http')
const PORT = process.env.PORT || 5001;
const auth = require('./middleware/auth');

const Message = require('./models/Message')
const ChatRoom = require('./models/ChatRoom')


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
        origin: "http://localhost:3000",
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
const chatRoomRoutes = require('./routes/chatRooms');
app.use('/api/auth', authRoutes);
app.use('/api/chatrooms', chatRoomRoutes)

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
        try {
            const message = new Message(data);
            await message.save();

            //get sender's username 
            await message.populate('sender', 'username');

            //send to everyone in the room  and include sender's details 
            io.to(data.chatRoom).emit('newMessage', message);
            console.log(`Message sent to room ${data.chatRoom}: ${data.content}`)
        
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


app.get('api/protected', auth, (req,res)=> {
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