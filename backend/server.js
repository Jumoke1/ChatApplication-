// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const File = require('./models/File');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

//  DEBUG: Check environment variables 
console.log('═══════════════════════════════════════════════════');
console.log('🔍 ENVIRONMENT VARIABLES CHECK:');
console.log('───────────────────────────────────────────────────');
console.log(`📌 PORT: ${process.env.PORT || '❌ NOT SET (using default 5001)'}`);
console.log(`📌 MONGODB_URI: ${process.env.MONGODB_URI ? ' SET' : '❌ NOT SET'}`);
console.log(`📌 JWT_SECRET: ${process.env.JWT_SECRET ? ' SET' : '❌ NOT SET'}`);
console.log('───────────────────────────────────────────────────');

// Show the actual MONGODB_URI being used 
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
console.log(`📌 Using MONGODB_URI: ${MONGODB_URI}`);
console.log('═══════════════════════════════════════════════════');

//  Basic middleware setup 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

//  MongoDB Connection 
console.log('🔄 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log(' MongoDB Connected Successfully');
    console.log(` Database: ${mongoose.connection.name}`);
    console.log(` Host: ${mongoose.connection.host}`);
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:');
    console.error('   Error Name:', err.name);
    console.error('   Error Message:', err.message);
    console.error('   Full Error:', err);
    process.exit(1);
});

//  Socket.io Configuration 
// Get frontend URL from environment or use fallback
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://flowchat-frontend-ll85.onrender.com';

const io = socketIo(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            FRONTEND_URL,  // ← Uses environment variable or fallback
            "https://your-frontend-url.onrender.com"  // Remove this if not needed
        ],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["my-custom-header"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
});

// keep track of who's online
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // if user id came through auth, set it up right away
    const userId = socket.handshake.auth?.userId;
    if (userId) {
        socket.userId = userId;
        connectedUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`User ${userId} connected and joined personal room`);
    }

    // manual registration for when auth doesn't work
    socket.on('register-user', (userId) => {
        socket.userId = userId;
        connectedUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`User ${userId} registered via event`);
        console.log(`Connected users: ${Array.from(connectedUsers.keys()).join(',')}`)
    });

    // joining and leaving rooms
    socket.on('joinRoom', (roomId) => {
        if (!roomId) return;
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room: ${roomId}`);
        
        socket.emit('roomJoined', { roomId, success: true });
        
        const room = io.sockets.adapter.rooms.get(roomId);
        io.to(roomId).emit('roomParticipants', {
            roomId,
            count: room?.size || 0
        });
    });

    socket.on('leaveRoom', (roomId) => {
        if (!roomId) return;
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room: ${roomId}`);
        
        const room = io.sockets.adapter.rooms.get(roomId);
        io.to(roomId).emit('roomParticipants', {
            roomId,
            count: room?.size || 0
        });
    });

    // let others know when someone is typing
    socket.on('typing', (data) => {
        console.log('Typing event received:', data);
        socket.to(data.roomId).emit('userTyping', {
            userId: data.userId,
            username: data.username,
            isTyping: data.isTyping,
            roomId: data.roomId
        });
    });

    // handle incoming messages
    socket.on('sendMessage', async (data) => {
        console.log('Received message:', data);
        
        try {
            const Message = require('./models/Message');
            
            const message = new Message({
                sender: data.sender,
                content: data.content,
                createdAt: data.createdAt || new Date()
            });

            if (data.fileId) {
                message.file = data.fileId;
            }

            // figure out if this is a dm or channel message
            let roomId;
            if (data.isDM && data.dmRoomId) {
                message.isDM = true;
                message.dmRoomId = data.dmRoomId;
                message.dmParticipants = data.dmParticipants || [];
                roomId = data.dmRoomId;
                console.log(`DM message for room: ${roomId}`);
            } else {
                message.chatRoom = data.chatRoom || data.room;
                message.isDM = false;
                roomId = data.room || data.chatRoom;
                console.log(`Channel message for room: ${roomId}`);
            }

            // make sure sender is in the room before broadcasting
            if (!socket.rooms.has(roomId)) {
                socket.join(roomId);
                console.log(`Added sender ${socket.id} to room ${roomId}`);
            }

            await message.save();
            
            if (data.fileId) {
                await File.findByIdAndUpdate(data.fileId, { 
                    messageId: message._id 
                });
            }
            
            await message.populate('sender', 'fullname email profilePhoto');
            if (message.file) {
                await message.populate('file');
            }

            const messageToSend = message.toObject();
            messageToSend.isDM = message.isDM;
            if (message.isDM) messageToSend.dmRoomId = message.dmRoomId;

            // send to everyone except the person who sent it
            socket.to(roomId).emit('newMessage', messageToSend);
            console.log(`Message broadcast to room ${roomId}`);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: error.message });
        }
    });
   
    // track when messages are delivered and read
    socket.on('message-delivered', (data) => {
        io.to(`user:${data.senderId}`).emit('message-status-updated', {
            messageId: data.messageId,
            status: 'delivered'
        });
    });

    socket.on('message-read', (data) => {
        io.to(`user:${data.senderId}`).emit('message-status-updated', {
            messageIds: data.messageIds,
            status: 'seen'
        });
    });

    // call related events
    socket.on('call-user', (data) => {
        console.log('\n=== CALL INITIATION ===');
        console.log('From:', data.from);
        console.log('To:', data.to);
        console.log('Type:', data.type);
        console.log('Room ID:', data.roomId);
        
        const targetSocketId = connectedUsers.get(data.to);
        if (!targetSocketId) {
            console.log(`Target user ${data.to} is not connected!`);
            socket.emit('call-error', { message: 'User is offline' });
            return;
        }
        
        console.log(`Forwarding call to user ${data.to}`);
        io.to(`user:${data.to}`).emit('incoming-call', {
            from: data.from,
            fromName: data.fromName,
            type: data.type,
            roomId: data.roomId
        });
        console.log('=== CALL INITIATION END ===\n');
    });

    socket.on('call-accepted', (data) => {
        console.log('\n=== CALL ACCEPTED ===');
        console.log('To:', data.to);
        console.log('Room ID:', data.roomId);
        
        const targetSocketId = connectedUsers.get(data.to);
        if (!targetSocketId) {
            console.log(`Target user ${data.to} is not connected!`);
            return;
        }
        
        io.to(`user:${data.to}`).emit('call-started', {
            roomId: data.roomId,
            type: data.type,
            from: socket.userId
        });
        console.log('=== CALL ACCEPTED END ===\n');
    });

    socket.on('call-rejected', (data) => {
        console.log('\n=== CALL REJECTED ===');
        console.log('To:', data.to);
        
        const targetSocketId = connectedUsers.get(data.to);
        if (targetSocketId) {
            io.to(`user:${data.to}`).emit('call-rejected', {
                from: socket.userId
            });
        }
        console.log('=== CALL REJECTED END ===\n');
    });

    // webrtc signaling - this is how peers find each other
    socket.on("call-signal", (data) => {
        console.log('\n=== WEBRTC SIGNAL ===');
        console.log('Signal from:', socket.userId);
        console.log('Signal to:', data.to);
        console.log('Signal type:', data.signal?.type);
        
        const targetSocketId = connectedUsers.get(data.to);
        if (!targetSocketId) {
            console.log(`Target user ${data.to} not found for signal`);
            return;
        }
        
        io.to(`user:${data.to}`).emit("call-signal", {
            signal: data.signal,
            from: socket.userId
        });
        
        console.log(`Signal forwarded to user ${data.to}`);
        console.log('=== WEBRTC SIGNAL END ===\n');
    });

    socket.on('end-call', (data) => {
        console.log('\n=== CALL ENDED ===');
        console.log('From:', socket.userId);
        console.log('To:', data.to);
        
        const targetSocketId = connectedUsers.get(data.to);
        if (targetSocketId) {
            io.to(`user:${data.to}`).emit('call-ended', {
                from: socket.userId
            });
        }
        console.log('=== CALL ENDED ===\n');
    });

    // clean up when user disconnects
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            console.log(`User ${socket.userId} removed from connected users`);
        }
    });
});

// API Routes 
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const chatRoomRoutes = require('./routes/chatRooms');
const dmMessageRoutes = require('./routes/dmMessages');
const noteRoutes = require('./routes/noteRoute');
const uploadRoutes = require('./routes/upload');

app.use('/api/users', require('./routes/user'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/auth', authRoutes);
app.use('/api/chatrooms', chatRoomRoutes);
app.use('/api/dmmessages', dmMessageRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/upload', uploadRoutes);

// simple test endpoints
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('<h1>Server is Running!</h1>');
});

app.get('/api/protected', auth, (req, res) => {
    res.json({ message: 'You accessed a protected route', user: req.user });
});

// Start Server 
server.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Test: http://localhost:${PORT}/api/test`);
    console.log(`🌐 Live URL: https://chatapplication-d2k9.onrender.com`);
    console.log('═══════════════════════════════════════════════════');
});