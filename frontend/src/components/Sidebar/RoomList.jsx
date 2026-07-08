import React from "react";

const RoomList = () => {
    const rooms = [
        { id: 1, name: 'General Chat', unread: 12, members: 24 },
        { id: 2, name: 'Developers', unread: 3, members: 8 },
        { id: 3, name: 'Design Team', unread: 0, members: 6 },
        { id: 4, name: 'Project Alpha', unread: 0, members: 4 },
    ];
    
    return (
        <div className="space-y-2">
            {rooms.map((room) => (
                <div 
                    key={room.id}  // added missing key prop
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition group"
                >
                    {/* chat bubble icon */}
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    
                    {/* room name and stats */}
                    <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{room.name}</span>
                            {/* show unread badge only if there are unread messages */}
                            {room.unread > 0 && (
                                <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full min-w-5 text-center">
                                    {room.unread}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">{room.members} members</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RoomList;