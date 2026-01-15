import { FiSettings, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext"
import {useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';


const ProfileSidebar = ({currentRoom, user}) => {
    const { token, logout} = useAuth()
    const {socket} = useSocket()
    const [messagesCount, setMessagesCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const getProfilePhoto = (userObj) => {
        if (!userObj?.profilePhoto) return null;
        if (userObj.profilePhoto.trim() === '') {
            return null;
        }
        return userObj.profilePhoto;
    };

    const profilePhoto = getProfilePhoto(user); 

    useEffect(() => {
        if (!currentRoom) return;

        const fetchMessagesCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `http://localhost:5001/api/messages/count/${currentRoom}`, {
                    
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setMessagesCount(res.data.count)
            } catch (err) {
                console.error('Failed to fetch message count', err)
            }
        };
        
        fetchMessagesCount();
    }, [currentRoom]);

    // Listen for online user updates
    useEffect(() => {
        if (!socket) return;
    
        socket.on('online-users', (users) => {
            setOnlineUsers(users);
        });

        // Request current online users
        socket.emit('get-online-users');

        return () =>  {
            socket.off('online-users'); 
        };
    }, [socket]);

    return(
        <aside className="w-80 h-screen bg-gray-50 flex flex-col">
            {/* Profile photo */}
            <div className="p-6 flex flex-col items-center">
                {profilePhoto ? (
                    <img
                        src={profilePhoto}
                        alt={user?.fullname || 'profile'}
                        className="w-20 h-20 rounded-full mb-3 object-cover"
                    />
                ):(
                    <div className="w-20 h-20 rounded-full mb-3 bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                            {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                )}
                <h2 className="text-xl font-bold text-gray-900">{user?.fullname}</h2>
                <p className="text-gray-500 text-sm ">{user?.email}</p>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-500 text-sm font-medium">Active</span>
                </div>
            </div>

            {/* Today's overview */}
            <div className="px-6 mt-4">
                <h3 className="text-gray-700 text-sm font-semibold mb-3">TODAY'S OVERVIEW</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                        <p className="text-gray-400 text-xs">Messages</p>
                        <h4 className="text-lg font-bold text-gray-800">{messagesCount}</h4>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                        <p className="text-gray-400 text-xs">Meetings</p>
                        <h4 className="text-lg font-bold text-gray-800">3</h4>
                    </div>
                </div>
            </div>
            
            {/* Online users - FIXED */}
            <div className="px-6 mt-6 flex-1 overflow-y-auto">
                <h3 className="text-gray-700 text-sm font-semibold mb-3">
                    ONLINE USERS ({onlineUsers.length})
                </h3>
                <div className="space-y-3">
                    {onlineUsers.length === 0 ? (
                        <p className="text-gray-500 text-sm">No other users online</p>
                    ) : (
                        onlineUsers.map((onlineUser) => {
                            // Don't show current user in the list
                            if (onlineUser.id === user?.id) return null;
                            
                            const userPhoto = getProfilePhoto(onlineUser);
                            
                            return (
                                <div key={onlineUser.id} className="flex items-center gap-3">
                                    {userPhoto ? (
                                        <img
                                            src={userPhoto}
                                            alt={onlineUser.fullname}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {onlineUser.fullname?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-700 text-sm font-medium">
                                            {onlineUser.fullname || 'User'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                   
                </div>
            </div>
            
            {/* Bottom buttons */}
            <div className="mt-auto p-6 border-t border-gray-200 flex flex-col gap-2">
                <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-100 transitions-colors">
                    <span className="text-gray-700 text-sm font-medium">Setting</span>
                </button>
                <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-100 transition-colors">
                    <FiLogOut className="text-red-600"></FiLogOut>
                    <span className="text-red-600 text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default ProfileSidebar;