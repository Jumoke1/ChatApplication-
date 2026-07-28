import {IoSearch, IoClose, IoPerson} from "react-icons/io5";
import { useState, useEffect } from "react";
import api from '../api';

const UserSearchModal = ({ isOpen, onClose, currentUser, onSelectUser}) => {

    const [users, setUsers] = useState([]) 
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false);

    // when modal opens, fetch the user list
    useEffect(() => {
        if (isOpen) {
            fetchAllUser();
        }
    }, [isOpen]);

    // grab all users from the api except the current user
    const fetchAllUser = async () => {
        setLoading(true); 
        try {
            console.log(' Fetching users from /api/users...');
            const response = await api.get('/users');
            console.log(' API Response:', response.data);
            console.log(' Response data structure:', response.data.data);

            // remove the current user from the list and clean up the data
            const validUsers = (response.data.data || [])
                .filter(user => user && user._id !== currentUser?.id)
                .map(user => ({
                    ...user,
                    id: user.id || user._id 
                }));

            console.log('After filtering - Valid users:', validUsers);
            setUsers(validUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // filter users based on search term (name or email)
    const filteredUsers = users.filter(user => {
        if (!user) return false;
        const name = user.fullname || "";
        const email = user.email || '';
        return (
            name.toLowerCase().includes(search.toLowerCase()) ||
            email.toLowerCase().includes(search.toLowerCase())
        );
    });
    
    if (!isOpen) return null;
      
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                {/* modal header with title and close button */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">New Direct Message</h3>
                        <p className="text-sm text-gray-500">Search users to message</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <IoClose className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                {/* search input field */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>
                </div>
                
                {/* scrollable list of users */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="mt-2 text-gray-500">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center">
                            <IoPerson className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">
                                {search ? `No users found for "${search}"` : "No users available"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {!search && "All registered users will appear here"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.id || user._id}
                                    onClick={() => {
                                        console.log(' CLICKED USER:', user);
                                        console.log('User ID:', user.id || user._id);
                                        console.log('User Name:', user.fullname);

                                        const userData = {
                                            id: user.id || user._id,
                                            _id: user._id || user.id,
                                            fullname: user.fullname,
                                            email: user.email,
                                            profilePhoto: user.profilePhoto
                                        };
                                        
                                        console.log(' Sending to onSelectUser:', userData);
                                        console.log(' Is onSelectUser a function?', typeof onSelectUser === 'function');

                                        if (onSelectUser && typeof onSelectUser === 'function') {
                                            onSelectUser(userData);
                                            console.log(' onSelectUser called successfully');
                                        } else {
                                            console.error('onSelectUser is undefined or not a function!', onSelectUser);
                                        }

                                        onClose();
                                    }}
                                    className="w-full flex items-center p-3 hover:bg-blue-50 rounded-lg transition-colors group"
                                >
                                    {/* user avatar - shows photo if available, otherwise fallback initials */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white mr-3 flex-shrink-0">
                                        {user.profilePhoto ? (
                                            <img 
                                                src={user.profilePhoto} 
                                                alt={user.fullname}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="font-bold text-lg">
                                                {(user.fullname || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    {/* user name and email */}
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {user.fullname || 'Unknown User'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {user.email || 'No email'}
                                        </p>
                                    </div>
                                    {/* plus icon that appears on hover */}
                                    <div className="ml-2 p-2 rounded-full bg-blue-100 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* footer showing how many users were found */}
                <div className="p-4 border-t bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserSearchModal;