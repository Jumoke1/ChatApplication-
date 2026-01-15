import {IoAdd, IoSearchOutline, IoChevronDown, IoChevronForward,} from "react-icons/io5";
import { FaHashtag } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from '../../api';

const LeftSideBar = ({onNewChatClick}) => {
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [messagesOpen, setMessagesOpen] = useState(true); 

  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([])
  const [currentRoom, setCurrentRoom] = useState('general')
  const [messages, setMessages] = useState([])
  

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentRoom) return;

      try {
        const response = await api.get(`/messages/${currentRoom}`);
        console.log('📥 Messages API response:', response.data);
        
        //  Handle API response properly
        if (response.data.success && Array.isArray(response.data.data)) {
          setMessages(response.data.data);
        } else if (Array.isArray(response.data)) {
          // Backward compatibility if API returns array directly
          setMessages(response.data);
        } else {
          console.warn('Unexpected API response format:', response.data);
          setMessages([]);
        }
      } catch(error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);  // Set empty array on error
      }
    }
    
    if (currentRoom) {
     fetchMessages();
    }
  }, [currentRoom]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await api.get("/chatrooms");
        const data = response.data
        setChannels(data);
      } catch (error) {
        console.error("failed to fetch chat room:", error);
      }
    }
    fetchChatRooms();
  }, []);
   

  return (
    <aside className="w-80 h-screen bg-[#f8fafb] border-r border-gray-300 flex flex-col">
      {/* Action Buttons */}
      <div className="p-6 flex gap-3">
        {/* New Chat Button */}
        <button 
        onClick={onNewChatClick}
        className="flex-1 h-11 bg-[#6f46ff] hover:bg-[#5558e3] text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
          <IoAdd className="w-5 h-5" />
          <span>New Chat</span>
        </button>

        {/* Browse Button */}
        <button className="h-11 px-5 bg-transparent hover:bg-gray-100 text-black rounded-lg font-medium flex items-center gap-2 transition-colors">
          <IoSearchOutline className="w-5 h-5" />
          <span>Browse</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Channels Section */}
        <div className="px-4 py-3">
          <button
            onClick={() => setChannelsOpen(!channelsOpen)}
            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2">
              {channelsOpen ? (
                <IoChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <IoChevronForward className="w-4 h-4 text-gray-400" />
              )}
              <span className="font-semibold text-gray-700">Channels</span>
            </div>
            <IoAdd className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {channelsOpen && (
            <div className="mt-2 space-y-1">
              {channels.map((channel) => {
                const isActive = channel.name === currentRoom;
                
                // ✅ FIXED: Safe message count calculation
                const messageCount = Array.isArray(messages) 
                  ? messages.filter((msg) => {
                      if (!msg || !msg.chatRoom) return false;
                      
                      // Handle both string ID and populated object
                      const chatRoomId = typeof msg.chatRoom === 'object' 
                        ? msg.chatRoom._id || msg.chatRoom.id
                        : msg.chatRoom;
                      
                      return chatRoomId === channel._id;
                    }).length
                  : 0;

                return (
                  <button
                    key={channel._id}
                    onClick={() => setCurrentRoom(channel.name)}  // Use channel.name, not _id
                    className={`w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors ${
                      isActive ? "bg-purple-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FaHashtag
                        className={`w-4 h-4 ${isActive ? "text-purple-600" : "text-gray-500"}`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "text-gray-800" : "text-gray-600"
                        }`}
                      >
                        {channel.name}
                      </span>
                    </div>

                    {/* Right side badges */}
                    <div className="flex items-center gap-2">
                      {messageCount > 0 && (
                        <div className="bg-gray-300 min-w-[24px] h-6 px-2 rounded-full flex items-center justify-center">
                          <span className="text-gray-800 text-xs font-bold">
                            {messageCount}
                          </span>
                        </div>
                      )}
                   
                      {channel.participants?.length > 0 && (
                        <div className="bg-purple-600 min-w-[24px] h-6 px-2 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {channel.participants.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div className="px-4 py-3 mt-6">
          <button
            onClick={() => setMessagesOpen(!messagesOpen)}
            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2">
              {messagesOpen ? (
                <IoChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <IoChevronForward className="w-4 h-4 text-gray-600" />
              )}
              <span className="font-semibold text-gray-700">
                Direct Messages
              </span>
            </div>
            <IoAdd className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {messagesOpen && (
            <div className="mt-2 space-y-1.5">
              {directMessages.map((dm) => (
                <button
                  key={dm.name}
                  className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full ${dm.avatar} flex items-center justify-center`}
                    ></div>
                    {dm.statusIndicator && (
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 ${dm.statusIndicator} rounded-full border-2 border-white`}
                      />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {dm.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {dm.status}
                    </div>
                  </div>

                  {dm.statusIndicator && dm.status !== "Active now" && (
                    <div
                      className={`w-2 h-2 ${dm.statusIndicator} rounded-full flex-shrink-0`}
                    />
                  )}
                  {dm.status === "Active now" && (
                    <div className="w-2 h-2 bg-[#ef4444] rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default LeftSideBar;