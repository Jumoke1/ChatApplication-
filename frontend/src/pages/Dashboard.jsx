import TopNavbar from "../components/TopNavbar";
import SideNavBar from "../components/Sidebar/SideNavbar";
import ProfileSidebar from "../components/Sidebar/profileSidebar";
import { useSocket } from '../context/SocketContext';
import React, { useEffect, useState } from "react";
import MiddleChatarea from "../components/Sidebar/MiddleChatarea";
import api from '../api';
import { useNavigate } from "react-router-dom";
import UserSearchModal from "../components/UserSearchModal";

const Dashboard = () => {
    const { socket, isConnected } = useSocket();
    const [user, setUser] = useState(null);
    console.log(user);
  
    const [currentRoom, setCurrentRoom] = useState('general');
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeDM, setActiveDM]= useState(null);
    const [dmMessages,  setDmMessages] = useState({});
    const [showUserSearch, setShowUserSearch] = useState(false);
    

    //Add this fuction:
    const handleDm = async (selectedUser) => {
        try{
            console.log('Starting DM with:' , selectedUser);

            //generate dm room id 
            const dmRoomId = `dm_${selectedUser.id || selectedUser._id}`;
            console.log('DM Room ID:', dmRoomId);

            //leave current room and join. dm room
            if (socket) {
                socket.emit('leaveRoom', currentRoom)
                socket.emit('joinRoom', dmRoomId)
            }

            //update state and clear message for new dm 
            setCurrentRoom(dmRoomId);
            setMessages([])

            //set active dm 
            setActiveDM({
                 userId: selectedUser.id || selectedUser._id,
                 userName: selectedUser.fullname,
                 userEmail: selectedUser.email,
                 roomId:dmRoomId
            })
            setMessages([])
            //close modal
            setShowUserSearch(false);
            console.log('DM started successfully')
        } catch (error) {
            console.error('Error startimg DM:', error)
        }
    }

    // Check authentication and load user data
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) { 
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);

            // Validate user data
            if (!parsedUser.id || !parsedUser.email) {
                throw new Error('Invalid user data');
            }

            setUser(parsedUser);

            // Load previous messages for the room 
            const fetchMessages = async () => {
                try {
                    let response;
                
                    if (activeDM) {
                        //fetch DM messages
                        response = await api.get(`/dmmessages/${activeDM.roomId}`);
                    
                    }else {

                        //Fetch channeel message
                        response = await api.get(`/messages/${currentRoom}`);

                    }

                    if (response.data.success) {
                        setMessages(response.data.data || []);
                    }
                } catch (error) {
                    console.error('Error fetching messages:', error);
                } finally {
                    setLoading(false);
                }
            };
            
            fetchMessages();
           
        } catch (error) {
            console.error('Error loading user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate, currentRoom]);
     
    // Join room and set up socket listeners
    useEffect(() => {
        if (!socket || !isConnected || !user) return;
        
        console.log('Joining room:', currentRoom);
        socket.emit('joinRoom', currentRoom);

        // Fetch messages when joining a room 
        const fetchRoomMessages = async () => {
            try {
                 let response

                 if (activeDM) {
                    // Fetch DM messages
                    console.log('Fetching DM messages for:', activeDM.roomId);
                    response = await api.get(`/dmmessages/${activeDM.roomId}`);
                 } else {

                    //fetch channel messages
                    response  = await api.get(`/messages/${currentRoom}`);

                 }
                 if (response.data.success) {
                    setMessages(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching room messages:', error);
            }
        };

        fetchRoomMessages();

        // Listen for new messages 
        const handleNewMessage = (newMessage) => {
            console.log('=== DEBUG: New Message ===');
            console.log('Full message:', newMessage);
            console.log('Sender value:', newMessage.sender);
            console.log('Sender type:', typeof newMessage.sender);
            console.log('Current user id:', user?.id);
            console.log('==========================');

            // Determine who the sender is
            let senderInfo;
            
            // Case 1: Sender is just a string ID (from other users)
            if (typeof newMessage.sender === 'string') {
                console.log('Sender is a string ID:', newMessage.sender);
                
                // Check if it's the current user
                if (newMessage.sender === user.id) {
                    senderInfo = {
                        id: user.id,
                        fullname: 'You',
                        profilePhoto: user.profilePhoto || null
                    };
                } else {
                    // It's another user - we need their info
                    // For now, use placeholder until we fetch real data
                    senderInfo = {
                        id: newMessage.sender,
                        fullname: 'User',
                        profilePhoto: null
                    };
                }
            }
            // Case 2: Sender is an object but might be missing info
            else if (typeof newMessage.sender === 'object' && newMessage.sender !== null) {
                console.log('Sender is an object:', newMessage.sender);
                
                // Check if it's the current user
                if (newMessage.sender.id === user.id) {
                    senderInfo = {
                        ...newMessage.sender,
                        fullname: 'You'
                    };
                } else {
                    senderInfo = newMessage.sender;
                }
            }
            // Case 3: No sender info at all
            else {
                console.log('No sender info, using current user');
                senderInfo = {
                    id: user.id,
                    fullname: 'You',
                    profilePhoto: user.profilePhoto || null
                };
            }
            
            // Format the message properly
            const formattedMessage = {
                ...newMessage,
                sender: senderInfo,
                createdAt: newMessage.createdAt || newMessage.timestamp || new Date().toISOString(),
                formattedTime: newMessage.createdAt ?
                    new Date(newMessage.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Just now'
            };
            
            console.log('Formatted message:', formattedMessage);
            
            setMessages(prev => {
                // Prevent duplicates
                const exists = prev.find(m => 
                    m._id === formattedMessage._id || 
                    (m.createdAt === formattedMessage.createdAt && 
                     m.sender?.id === formattedMessage.sender?.id)
                );
                if (exists) return prev;
                return [...prev, formattedMessage];
            });
        };
        
        socket.on('newMessage', handleNewMessage);
        
        // Clean up
        return () => {
            
            socket.off('newMessage', handleNewMessage);
            socket.emit('leaveRoom', currentRoom);
        };
    }, [socket, isConnected, currentRoom, user]);

    // Change chat room
    const handleRoomChange = (roomId) => {
        if (socket && currentRoom !== roomId) {
            socket.emit('leaveRoom', currentRoom);
            setCurrentRoom(roomId);
            setMessages([]); // Clear messages for new room
        }
    };

    // Send Message 
const handleSendMessage = async (messageContent) => {
    if (!socket || !messageContent.trim() || !user) return;

    console.log('🚀 SENDING MESSAGE DEBUG:', {
            room: currentRoom,
            content: messageContent,
            isDM: !!activeDM,
            activeDM: activeDM,
            messagesBefore: messages.length
        });

    try {
        const token = localStorage.getItem("token");
        
        if (!token) {
            console.error("No token found in local storage");
            navigate('/login');
            return;
        }
        
        // Create message object for immediate UI update
        const tempMessage = {
            _id: `temp-${Date.now()}`,
            content: messageContent.trim(),
            sender: {
                id: user.id,
                fullname: user.fullname || 'You',
                profilePhoto: user.profilePhoto || null
            },
            room: currentRoom,
            createdAt: new Date().toISOString(),
            formattedTime: new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            isTemp: true,
            isDm: !!activeDM,
            dmRoomId: activeDM?.roomId

        };
                
        // Update UI immediately
        setMessages(prev => [...prev, tempMessage]);
        
        //decidde which endpoint to use the message dm or chanel 
        let savedMessage;

        if (activeDM) {

            console.log('Sending DM to endpoint:', `/dmmessages/${activeDM.roomId}`);
            const res = await api.post(`/dmmessages/${activeDM.roomId}`,
        {
            content:messageContent.trim()
        });
        // Save to database
        savedMessage = res.data.data;
        console.log('DM SAVED:', savedMessage);
    } else {

        //send the message to channel
        console.log('sending channel message to endpoint',`/messages/${currentRoom}`)
        const res = await api.post(`/messages/${currentRoom}`, {
                content: messageContent.trim()
            });
            savedMessage = res.data.data;
            console.log('✅ CHANNEL MESSAGE SAVED:', savedMessage);
        }
       
        // ✅ DEBUG: Check what backend returns
        // console.log('🔍 BACKEND RESPONSE:', res.data);
        //const savedMessage = res.data.data;
        //console.log('🔍 SAVED MESSAGE FROM BACKEND:', savedMessage);
        //console.log('🔍 SENDER OBJECT:', savedMessage.sender);
        //console.log('🔍 HAS FULLNAME?', savedMessage.sender?.fullname);
        //console.log('🔍 SENDER TYPE:', typeof savedMessage.sender);
        
        // Update the temp message with the saved message
        setMessages(prev => prev.map(msg => 
            msg._id === tempMessage._id ? {
                ...savedMessage,
                sender: savedMessage.sender || tempMessage.sender,
                formattedTime: savedMessage.createdAt ? 
                    new Date(savedMessage.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }) : 'Just now',
                    isDM: !!activeDM
            } : msg
        ));
        
        // Emit to other users
        const emitRoom = activeDM ? activeDM.roomId : currentRoom;
        console.log('📤 Emitting to socket:', emitRoom);

        const socketMessage = {
            ...savedMessage,
            room: emitRoom, 
            isDM: !!activeDM
        };
        socket.emit("sendMessage", socketMessage);
        
    } catch (error) {
        console.error("Message not saved:", error);
        
        // Remove temp message if save failed
        setMessages(prev => prev.filter(msg => !msg.isTemp));
        
        if (error.response?.status === 401 || 
            error.response?.status === 400 || 
            (error.response?.data?.message && 
             error.response.data.message.includes('token'))) {
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }
};
    
    // Show loading state
    if (loading || !user) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            {/* Top Navbar */}
            <TopNavbar user={user}
                onSearchClick={() => setShowUserSearch(true)}/>

                {/*user search modal */}
            <UserSearchModal
                isOpen={showUserSearch}
                onClose={ () =>setShowUserSearch(false)}
                currentUser={user}
                onSelectUser={handleDm}
                />

            {/* Main container takes remaining space */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar */}
                <SideNavBar 
                    onRoomChange={handleRoomChange}
                    currentRoom={currentRoom}
                    onNewChatClick={() => setShowUserSearch(true)}
                    className='hidden md:flex md:w-16 lg:w-64'
                />

                {/* Main chat area */}
                <MiddleChatarea 
                    messages={messages} 
                    onSendMessage={handleSendMessage} 
                    currentRoom={currentRoom} 
                    currentUser={user} 
                    activeDm={activeDM}
                    className='flex-1'

                     onExitDM={() => {
                     // Exit DM logic
                        if (socket) {
                            socket.emit('leaveRoom', currentRoom);
                            socket.emit('joinRoom', 'general');
                        }
                        setCurrentRoom('general');
                        setActiveDM(null);

                        // Load general messages
                        api.get('/messages/general').then(response => {
                            if (response.data.success) {
                                setMessages(response.data.data || []);
                            }
                        });
                    }}


                />

                {/* Right Side Bar */}
                <ProfileSidebar 
                    currentRoom={currentRoom}
                    user={user} 
                    className="hidden md:flex md:w-16 lg:w-64"
                />
            </div>
           
        </div>
    );
};
export default Dashboard;