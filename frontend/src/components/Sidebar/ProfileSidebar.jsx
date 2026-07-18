import { FiSettings, FiLogOut, FiCamera } from "react-icons/fi";
import { IoDocumentText, IoCreate, IoClose, IoMoonOutline, IoNotificationsOutline } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';

const ProfileSidebar = ({ currentRoom, user, onUserUpdate, onCloseMobile }) => {
    // Auth & Socket 
    const { token, logout } = useAuth();
    const { socket } = useSocket();

    // API Base URL 
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    // State 
    const [messagesCount, setMessagesCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [openNotes, setOpenNotes] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [currentUser, setCurrentUser] = useState(user);
    const fileInputRef = useRef(null);

    // Debug
    useEffect(() => {
        console.log("🔹 showSettings changed to:", showSettings);
    }, [showSettings]);

    // Dark Mode
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Load saved settings from localStorage
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedNotifications = localStorage.getItem('notifications') !== 'false';
        setIsDarkMode(savedDarkMode);
        setNotificationsEnabled(savedNotifications);
    }, []);

    // Save preferences
    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        localStorage.setItem('notifications', notificationsEnabled);
    }, [notificationsEnabled]);

    // Personal Notes
    useEffect(() => {
        const loadNote = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/notes/my-note`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNote(res.data.content || "");
            } catch (err) {
                console.log("Failed to load note");
            }
        };
        loadNote();
    }, [token, API_BASE]);

    const saveNote = async (value) => {
        try {
            setSaving(true);
            await fetch(`${API_BASE}/api/notes/my-note`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: value })
            });
        } catch (err) {
            console.log("Failed to save note");
        } finally {
            setSaving(false);
        }
    };

    // Profile Photo
    const getProfilePhoto = () => {
        if (currentUser?.profilePhoto && currentUser.profilePhoto.trim() !== '') {
            if (currentUser.profilePhoto.startsWith('http')) {
                return currentUser.profilePhoto;
            }
            return `${API_BASE}${currentUser.profilePhoto}`;
        }
        return null;
    };

    const profilePhoto = getProfilePhoto();

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('profilePhoto', file);

        try {
            setUploading(true);
            const response = await axios.put(
                `${API_BASE}/api/users/profile-photo`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                const updatedUser = { ...currentUser, profilePhoto: response.data.profilePhoto };
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                if (onUserUpdate) onUserUpdate(updatedUser);
                setShowPhotoModal(false);
                alert('Profile photo updated successfully!');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert(error.response?.data?.message || 'Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!confirm('Are you sure you want to remove your profile photo?')) return;
        try {
            setUploading(true);
            const response = await axios.delete(
                `${API_BASE}/api/users/profile-photo`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const updatedUser = { ...currentUser, profilePhoto: null };
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                if (onUserUpdate) onUserUpdate(updatedUser);
                setShowPhotoModal(false);
                alert('Profile photo removed successfully!');
            }
        } catch (error) {
            console.error('Error removing photo:', error);
            alert('Failed to remove photo');
        } finally {
            setUploading(false);
        }
    };

    // Message Count
    useEffect(() => {
        if (!currentRoom) return;
        const fetchMessagesCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `${API_BASE}/api/messages/count/${currentRoom._id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMessagesCount(res.data.count);
            } catch (err) {
                console.error('Failed to fetch message count', err);
            }
        };
        fetchMessagesCount();
    }, [currentRoom, API_BASE]);

    // Online Users
    useEffect(() => {
        if (!socket) return;
        socket.on('online-users', (users) => setOnlineUsers(users));
        socket.emit('get-online-users');
        return () => socket.off('online-users');
    }, [socket]);

    // Render
    return (
        <>
            <aside className="w-72 h-screen bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
                {/* Profile Header */}
                <div className="relative p-5 flex flex-col items-center border-b border-gray-100">
                    {/* Close button – mobile only */}
                    <button
                        onClick={onCloseMobile}
                        className="md:hidden absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-1 rounded"
                        aria-label="Close profile sidebar"
                    >
                        ✕
                    </button>

                    {/* Avatar */}
                    <button
                        onClick={() => setShowPhotoModal(true)}
                        className="relative group cursor-pointer"
                    >
                        {profilePhoto ? (
                            <div className="relative">
                                <img
                                    src={profilePhoto}
                                    alt={currentUser?.fullname || 'Profile'}
                                    className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-100 transition-all duration-200 group-hover:ring-purple-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <FiCamera className="text-white text-xl" />
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-purple-100 transition-all duration-200 group-hover:ring-purple-300 group-hover:scale-105">
                                    <span className="text-white text-2xl font-bold">
                                        {currentUser?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <FiCamera className="text-white text-xl" />
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
                    </button>

                    {/* Name & Settings Gear */}
                    <div className="w-full flex items-center justify-between mt-3">
                        <div className="flex flex-col items-start">
                            <h2 className="text-md font-semibold text-gray-900">{currentUser?.fullname}</h2>
                            <p className="text-xs text-gray-400">{currentUser?.email}</p>
                        </div>
                        <button
                            onClick={() => {
                                console.log('⚙️ Gear clicked!');
                                setShowSettings(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Settings"
                        >
                            <FiSettings className="text-gray-500 text-lg" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full mt-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-600 text-xs font-medium">Active</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 opacity-60">Click avatar to change photo</p>
                </div>

                {/* Activity */}
                <div className="px-4 py-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Activity</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => window.open('https://excalidraw.com/', '_blank')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition">
                                <IoCreate className="text-orange-500 text-sm" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-700">Whiteboard</p>
                                <p className="text-xs text-gray-400">Start drawing collaboratively</p>
                            </div>
                            <span className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition">→</span>
                        </button>
                        <button
                            onClick={() => setOpenNotes(true)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition">
                                <IoDocumentText className="text-purple-500 text-sm" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-700">Personal Notes</p>
                                <p className="text-xs text-gray-400">Your private thoughts</p>
                            </div>
                            <span className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition">→</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Settings button */}
                <div className="mt-auto p-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={() => {
                            console.log('Bottom Settings clicked!');
                            setShowSettings(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
                    >
                        <FiSettings className="text-gray-400 group-hover:text-gray-600 text-sm" />
                        <span className="text-sm text-gray-600 group-hover:text-gray-800">Settings</span>
                    </button>
                </div>
            </aside>

            {/* Photo Modal */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Profile Photo</h2>
                            <button onClick={() => setShowPhotoModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                                <IoClose className="text-gray-500 text-xl" />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex flex-col items-center mb-6">
                                {profilePhoto ? (
                                    <img src={profilePhoto} alt="Current profile" className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-100" />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-purple-100">
                                        <span className="text-white text-4xl font-bold">
                                            {currentUser?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                                <p className="text-sm text-gray-500 mt-3">Current photo</p>
                            </div>
                            <div className="space-y-3">
                                <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={uploading}
                                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <FiCamera className="text-lg" />
                                            Upload New Photo
                                        </>
                                    )}
                                </button>
                                {profilePhoto && (
                                    <button onClick={handleRemovePhoto} disabled={uploading} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors">
                                        Remove Photo
                                    </button>
                                )}
                                <p className="text-xs text-gray-400 text-center mt-4">
                                    Recommended: Square image, max 5MB<br />
                                    Supported formats: JPG, PNG, GIF
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {openNotes && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Personal Notes</h2>
                            <button onClick={() => setOpenNotes(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                                <IoClose className="text-gray-500 text-xl" />
                            </button>
                        </div>
                        <div className="p-5">
                            <textarea
                                value={note}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNote(value);
                                    saveNote(value);
                                }}
                                placeholder="Write your personal thoughts here..."
                                className="w-full h-80 text-sm border border-gray-200 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            {saving && <p className="text-xs text-gray-400 mt-2 text-right">Saving...</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                                <IoClose className="text-gray-500 text-xl" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Dark Mode toggle */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <IoMoonOutline className="text-gray-500 text-lg" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Dark Mode</p>
                                        <p className="text-xs text-gray-400">Switch between light and dark</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        isDarkMode ? 'bg-gray-800' : 'bg-gray-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Notifications toggle */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <IoNotificationsOutline className="text-gray-500 text-lg" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Notifications</p>
                                        <p className="text-xs text-gray-400">Receive message alerts</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        notificationsEnabled ? 'bg-gray-800' : 'bg-gray-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        {/* Done & Logout */}
                        <div className="p-5 border-t bg-gray-50 rounded-b-xl space-y-3">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors"
                            >
                                Done
                            </button>
                            <button
                                onClick={() => {
                                    console.log('git add Logout button clicked inside modal');
                                    if (window.confirm('Are you sure you want to log out?')) {
                                        console.log(' User confirmed logout, calling logout()');
                                        logout();
                                    }
                                }}
                                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <FiLogOut className="text-red-500" />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfileSidebar;