import TopNavbar from "../components/TopNavbar";
import SideNavBar from "../components/Sidebar/SideNavbar";
import ProfileSidebar from "../components/Sidebar/ProfileSidebar";
import { useSocket } from '../context/SocketContext';
import React, { useEffect, useState, useCallback } from "react";
import MiddleChatarea from "../components/Sidebar/MiddleChatarea";
import api from '../api';
import { useNavigate } from "react-router-dom";
import UserSearchModal from "../components/UserSearchModal";

const Dashboard = () => {
    const { socket, isConnected } = useSocket();
    const [user, setUser] = useState(null);
    const [recentDms, setRecentDMs] = useState([]);
    const [users, setUsers] = useState([]);
    const [channels, setChannels] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeDM, setActiveDM] = useState(null);
    const [dmMessages, setDmMessages] = useState({});
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [scrollToMessageId, setScrollToMessageId] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // mobile sidebar toggles
    const [showSidebar, setShowSidebar] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const toggleSidebar = () => setShowSidebar(!showSidebar);
    const toggleProfile = () => setShowProfile(!showProfile);

    // log socket connection for debugging
    useEffect(() => {
        if (socket) {
            console.log('Socket connected:', socket.id);
        }
    }, [socket]);

    // load channels, default to 'general' or fallback
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const response = await api.get('/chatrooms');
                let channelsData = [];
                if (Array.isArray(response.data)) {
                    channelsData = response.data;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    channelsData = response.data.data;
                }
                setChannels(channelsData);

                let generalChannel = channelsData.find(ch => ch.name === 'general');
                if (!generalChannel && channelsData.length > 0) {
                    generalChannel = channelsData[0];
                }

                if (generalChannel) {
                    setCurrentRoom(generalChannel);
                } else {
                    // fallback so dashboard doesn't get stuck
                    const fallbackRoom = { _id: 'general', name: 'general' };
                    setChannels([fallbackRoom]);
                    setCurrentRoom(fallbackRoom);
                }
            } catch (error) {
                console.error('Error fetching channels:', error);
                const fallbackRoom = { _id: 'general', name: 'general' };
                setChannels([fallbackRoom]);
                setCurrentRoom(fallbackRoom);
            }
        };
        fetchChannels();
    }, []);

    // reconnect socket if it drops unexpectedly
    useEffect(() => {
        if (!user || !socket) return;
        if (!socket.connected) {
            socket.connect();
        }
    }, [user, socket]);

    // load saved DMs from localStorage
    useEffect(() => {
        const savedDMs = localStorage.getItem('recentDMs');
        if (savedDMs) {
            try {
                setRecentDMs(JSON.parse(savedDMs));
            } catch (error) {
                console.error('Error loading DMs:', error);
            }
        }
    }, []);

    // keep DMs list in sync with localStorage
    useEffect(() => {
        if (recentDms.length > 0) {
            localStorage.setItem('recentDMs', JSON.stringify(recentDms));
        }
    }, [recentDms]);

    // add or update a DM in the recent list
    const addToRecentDMs = useCallback((dmInfo) => {
        setRecentDMs(prev => {
            const exist = prev.find(dm => dm.userId === dmInfo.userId);
            if (exist) {
                return prev.map(dm =>
                    dm.userId === dmInfo.userId
                        ? { ...dm, lastActive: new Date().toISOString() }
                        : dm
                );
            }
            return [...prev, { ...dmInfo, lastActive: new Date().toISOString() }];
        });
    }, []);

    // load an existing DM conversation
    const loadExistingDM = useCallback(async (dmInfo, messageId = null) => {
        try {
            if (socket && currentRoom) {
                socket.emit('leaveRoom', currentRoom._id);
            }
            if (socket) {
                socket.emit('joinRoom', dmInfo.roomId);
            }
            setCurrentRoom({ _id: dmInfo.roomId, name: dmInfo.userName });
            setActiveDM(dmInfo);
            setScrollToMessageId(messageId);
            setMessages([]);

            const response = await api.get(`/dmmessages/${dmInfo.roomId}`);
            if (response.data.success) {
                setMessages(response.data.data || []);
            }
            addToRecentDMs(dmInfo);
        } catch (error) {
            console.error('Error loading DM:', error);
            setMessages([]);
        }
    }, [socket, currentRoom, addToRecentDMs]);

    // start a new DM with a user
    const handleDm = useCallback(async (selectedUser) => {
        try {
            if (!selectedUser || (!selectedUser.id && !selectedUser._id)) {
                alert('Invalid user');
                return;
            }
            const userIds = [user.id, selectedUser.id].sort();
            const dmRoomId = `dm_${userIds[0]}_${userIds[1]}`;
            const dmInfo = {
                userId: selectedUser.id || selectedUser._id,
                userName: selectedUser.fullname,
                userEmail: selectedUser.email,
                roomId: dmRoomId,
                profilePhoto: selectedUser.profilePhoto
            };

            if (socket && currentRoom) {
                socket.emit('leaveRoom', currentRoom._id);
            }
            if (socket) {
                socket.emit('joinRoom', dmRoomId);
            }

            setCurrentRoom({ _id: dmRoomId, name: dmInfo.userName });
            setMessages([]);
            setActiveDM(dmInfo);
            addToRecentDMs(dmInfo);

            const response = await api.get(`/dmmessages/${dmRoomId}`);
            if (response.data.success) {
                setMessages(response.data.data || []);
            }
            setShowUserSearch(false);
        } catch (error) {
            console.error('Error starting DM:', error);
            setMessages([]);
        }
    }, [user, socket, currentRoom, addToRecentDMs]);

    // check auth and load user data
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser.id || !parsedUser.email) {
                throw new Error('Invalid user');
            }
            setUser(parsedUser);
            setLoading(false);
        } catch (error) {
            console.error('User loading error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate]);

    // fetch messages when room changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (!currentRoom) return;
            try {
                let response;
                if (activeDM) {
                    response = await api.get(`/dmmessages/${activeDM.roomId}`);
                } else {
                    response = await api.get(`/messages/${currentRoom._id}`);
                }
                if (response.data.success) {
                    setMessages(response.data.data || []);
                } else {
                    setMessages([]);
                }
            } catch (error) {
                setMessages([]);
            }
        };
        fetchMessages();
    }, [currentRoom, activeDM]);

    // socket event listeners for real‑time messages
    useEffect(() => {
        if (!socket || !isConnected || !user || !currentRoom) return;

        socket.emit('joinRoom', currentRoom._id);

        socket.on('roomJoined', (roomId) => {
            console.log('Joined room:', roomId);
        });

        socket.on('roomParticipants', (data) => {
            console.log('Room participants:', data);
        });

        const handleNewMessage = (newMessage) => {
            const senderId = newMessage.sender?._id || newMessage.sender?.id || newMessage.sender;
            const isOwnMessage = senderId === user.id;

            let shouldAddMessage = false;
            if (activeDM && newMessage.isDM && newMessage.dmRoomId === activeDM.roomId) {
                shouldAddMessage = true;
            } else if (!activeDM && !newMessage.isDM &&
                (newMessage.room === currentRoom?._id || newMessage.chatRoom === currentRoom?._id)) {
                shouldAddMessage = true;
            }
            if (!shouldAddMessage) return;

            const formattedMessage = {
                ...newMessage,
                file: newMessage.file || null,
                sender: typeof newMessage.sender === 'object' ? newMessage.sender : {
                    _id: newMessage.sender,
                    fullname: 'User',
                    profilePhoto: null
                },
                createdAt: newMessage.createdAt || new Date().toISOString(),
            };

            setMessages(prev => {
                // replace temp message if it exists
                if (newMessage.tempId) {
                    const exists = prev.find(m => m.tempId === newMessage.tempId);
                    if (exists) {
                        return prev.map(m => m.tempId === newMessage.tempId ? formattedMessage : m);
                    }
                }
                const exists = prev.find(m => m._id === formattedMessage._id);
                if (exists) return prev;
                return [...prev, formattedMessage];
            });

            if (!isOwnMessage) {
                socket.emit("message-delivered", {
                    messageId: newMessage._id,
                    senderId: senderId
                });
            }
        };

        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('roomJoined');
            socket.off('roomParticipants');
            if (currentRoom) {
                socket.emit('leaveRoom', currentRoom._id);
            }
        };
    }, [socket, isConnected, currentRoom, user, activeDM]);

    // send a message (text or file)
    const handleSendMessage = useCallback((messageContent, fileAttachment = null) => {
        if (!socket || !user || !currentRoom) return;
        if (!messageContent?.trim() && !fileAttachment) return;

        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            _id: tempId,
            content: messageContent || (fileAttachment ? `📎 ${fileAttachment.originalName}` : ''),
            file: fileAttachment ? {
                _id: fileAttachment._id,
                originalName: fileAttachment.originalName,
                mimeType: fileAttachment.mimeType,
                size: fileAttachment.size,
                url: fileAttachment.url
            } : null,
            sender: {
                id: user.id,
                _id: user.id,
                fullname: 'You',
                profilePhoto: user.profilePhoto || null
            },
            room: currentRoom._id,
            createdAt: new Date().toISOString(),
            isTemp: true,
            isDM: !!activeDM,
            dmRoomId: activeDM?.roomId,
            tempId: tempId
        };

        setMessages(prev => [...prev, tempMessage]);

        socket.emit("sendMessage", {
            content: messageContent || (fileAttachment ? `📎 ${fileAttachment.originalName}` : ''),
            fileId: fileAttachment?._id || null,
            sender: user.id,
            room: activeDM ? activeDM.roomId : currentRoom._id,
            chatRoom: activeDM ? null : currentRoom._id,
            isDM: !!activeDM,
            dmRoomId: activeDM?.roomId,
            dmParticipants: activeDM ? [user.id, activeDM.userId] : undefined,
            createdAt: new Date().toISOString(),
            tempId: tempId
        });
    }, [socket, user, currentRoom, activeDM]);

    // switch to a channel
    const handleRoomChange = useCallback((room, messageId = null) => {
        if (!socket) return;
        if (currentRoom?._id !== room._id) {
            socket.emit('leaveRoom', currentRoom?._id);
        }
        socket.emit('joinRoom', room._id);
        setCurrentRoom(room);
        setActiveDM(null);
        setMessages([]);
        setScrollToMessageId(messageId);

        api.get(`/messages/${room._id}`)
            .then(res => {
                if (res.data.success) {
                    setMessages(res.data.data || []);
                }
            })
            .catch(err => console.error('Failed to load messages:', err));
    }, [socket, currentRoom]);

    // exit DM and go back to general
    const handleExitDM = useCallback(() => {
        const generalChannel = channels.find(ch => ch.name === 'general');
        if (generalChannel && socket) {
            if (currentRoom) {
                socket.emit('leaveRoom', currentRoom._id);
                socket.emit('joinRoom', generalChannel._id);
            }
            setCurrentRoom(generalChannel);
            setActiveDM(null);
            api.get(`/messages/${generalChannel._id}`).then(response => {
                if (response.data.success) {
                    setMessages(response.data.data || []);
                }
            });
        }
    }, [channels, socket, currentRoom]);

    // loading state
    if (loading || !user || !currentRoom) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            <TopNavbar
                user={user}
                users={users}
                messages={messages}
                recentDMs={recentDms}
                onSearchClick={() => setShowUserSearch(true)}
                onSelectDM={loadExistingDM}
                onSelectUser={handleDm}
                onSelectChannel={handleRoomChange}
                onToggleSidebar={toggleSidebar}
                onToggleProfile={toggleProfile}
                showSidebar={showSidebar}
                showProfile={showProfile}
            />

            <UserSearchModal
                isOpen={showUserSearch}
                onClose={() => setShowUserSearch(false)}
                currentUser={user}
                onSelectUser={handleDm}
            />

            <div className="flex flex-1 overflow-hidden relative">
                {/* left sidebar – channel list / DMs */}
                <div className={`
                    ${showSidebar ? 'flex' : 'hidden'}
                    md:flex
                    md:w-16 lg:w-64
                    flex-shrink-0
                    absolute md:relative
                    z-20 md:z-auto
                    h-full
                    bg-gray-800
                `}>
                    <SideNavBar
                        onRoomChange={handleRoomChange}
                        currentRoom={currentRoom}
                        onNewChatClick={() => setShowUserSearch(true)}
                        recentDMs={recentDms}
                        onLoadDM={loadExistingDM}
                        messages={messages}
                        currentUser={user}
                        onCloseMobile={() => setShowSidebar(false)}
                    />
                </div>

                {/* main chat area */}
                <MiddleChatarea
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    currentRoom={currentRoom}
                    currentUser={user}
                    activeDm={activeDM}
                    scrollToMessageId={scrollToMessageId}
                    className="flex-1"
                    onExitDM={handleExitDM}
                    isDarkMode={isDarkMode}
                    onToggleSidebar={toggleSidebar}
                    onToggleProfile={toggleProfile}
                />

                {/* right profile sidebar */}
                <div className={`
                    ${showProfile ? 'flex' : 'hidden'}
                    md:flex
                    md:w-16 lg:w-64
                    flex-shrink-0
                    absolute md:relative
                    right-0
                    z-20 md:z-auto
                    h-full
                    bg-gray-800
                `}>
                    <ProfileSidebar
                        currentRoom={currentRoom}
                        user={user}
                        onCloseMobile={() => setShowProfile(false)}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;