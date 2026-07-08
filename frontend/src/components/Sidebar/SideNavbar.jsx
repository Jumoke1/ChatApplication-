import { IoAdd, IoSearchOutline, IoChevronDown, IoChevronForward, IoClose } from "react-icons/io5";
import { FaHashtag } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from '../../api';

const LeftSideBar = ({ 
    onNewChatClick,  
    recentDMs = [],  
    onLoadDM, 
    onRoomChange,    
    currentRoom,
    currentUser,
    messages: propMessages = [] 
}) => {
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [messagesOpen, setMessagesOpen] = useState(true); 
  const [channels, setChannels] = useState([]);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [isChannelPrivate, setIsChannelPrivate] = useState(false);
  const messages = propMessages; 

  // grab all chat rooms from the server when component loads
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await api.get("/chatrooms");
        console.log('📡 Raw response:', response.data);
        
        let channelsData;
        if (Array.isArray(response.data)) {
          channelsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          channelsData = response.data.data;
        } else {
          console.error('Unexpected API response format:', response.data);
          channelsData = [];
        }
        setChannels(channelsData);
        console.log(`✅ Loaded ${channelsData.length} channels`);
      } catch (error) {
        console.error("Failed to fetch chat rooms:", error);
        setChannels([]);
      }
    };
    fetchChatRooms();
  }, []);

  // create a new channel with validation
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      alert("Please enter a channel name");
      return;
    }

    // only allow lowercase letters, numbers, and hyphens for channel names
    const channelNameRegex = /^[a-z0-9-]+$/;
    if (!channelNameRegex.test(newChannelName.trim())) {
      alert("Channel name can only contain lowercase letters, numbers, and hyphens");
      return;
    }
    
    if (!currentUser || !currentUser.id) {
      alert("Please log in to create a channel");
      return;
    }
    
    try {
      const channelData = {
        name: newChannelName.trim(),
        description: channelDescription.trim(),
        isPrivate: isChannelPrivate,
        participants: [currentUser.id]
      };
      
      console.log('📡 Creating channel:', channelData);
      const response = await api.post('/chatrooms', channelData);
      console.log('✅ Create channel response:', response.data);
      
      if (response.data.success || response.data._id) {
        const newChannel = response.data.data || response.data;
        
        // refresh the channel list after creation
        const updatedResponse = await api.get("/chatrooms");
        let channelsData;
        if (Array.isArray(updatedResponse.data)) {
          channelsData = updatedResponse.data;
        } else if (updatedResponse.data.data && Array.isArray(updatedResponse.data.data)) {
          channelsData = updatedResponse.data.data;
        } else {
          channelsData = [];
        }
        
        setChannels(channelsData);
        setNewChannelName('');
        setChannelDescription('');
        setIsChannelPrivate(false);
        setShowCreateChannelModal(false);
        
        // automatically switch to the newly created channel
        if (newChannel) {
          onRoomChange(newChannel);
        }
      } else {
        alert(response.data?.message || "Failed to create channel");
      }
    } catch (error) {
      console.error("❌ Failed to create channel:", error);
      alert(error.response?.data?.message || "Failed to create channel");
    }
  };

  // open a direct message conversation
  const handleDmClick = (dm) => {
    onLoadDM(dm);
  };

  // build the full profile photo url, handles both absolute and relative paths
  const getProfilePhotoUrl = (dm) => {
    if (dm?.profilePhoto && dm.profilePhoto.trim() !== '') {
      if (dm.profilePhoto.startsWith('http')) {
        return dm.profilePhoto;
      }
      return `http://localhost:5001${dm.profilePhoto}`;
    }
    return null;
  };

  // filter out duplicate dms based on user id
  const uniqueDMs = recentDMs.reduce((unique, dm) => {
    if (!unique.find(item => item.userId === dm.userId)) {
      unique.push(dm);
    }
    return unique;
  }, []);

  return (
    <>
      <aside className="w-80 h-screen bg-[#f8fafb] border-r border-gray-200 flex flex-col">
        {/* top action buttons - new chat and browse */}
        <div className="p-4 flex gap-2">
          <button 
            onClick={onNewChatClick}
            className="flex-1 h-10 bg-[#6f46ff] hover:bg-[#5558e3] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <IoAdd className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <button className="h-10 px-4 bg-transparent hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
            <IoSearchOutline className="w-4 h-4" />
            <span>Browse</span>
          </button>
        </div>

        {/* scrollable list of channels and dms */}
        <div className="flex-1 overflow-y-auto">
          {/* channels section */}
          <div className="px-3 py-2">
            <div className="w-full px-2 py-1.5 flex items-center justify-between hover:bg-gray-100 rounded-md transition-colors group">
              <button
                onClick={() => setChannelsOpen(!channelsOpen)}
                className="flex items-center gap-1.5 flex-1 text-left"
              >
                {channelsOpen ? (
                  <IoChevronDown className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <IoChevronForward className="w-3.5 h-3.5 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Channels</span>
              </button>
              
              <button 
                onClick={() => setShowCreateChannelModal(true)}
                className="p-1 hover:bg-gray-200 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                title="Create new channel"
              >
                <IoAdd className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            {channelsOpen && (
              <div className="mt-1 space-y-0.5">
                {channels.map((channel) => {
                  const isActive = currentRoom?._id === channel._id;
                  
                  // count how many messages are in this channel
                  const messageCount = Array.isArray(messages) 
                    ? messages.filter((msg) => {
                        if (!msg || !msg.chatRoom) return false;
                        const chatRoomId = typeof msg.chatRoom === 'object' 
                          ? msg.chatRoom._id || msg.chatRoom.id
                          : msg.chatRoom;
                        return chatRoomId === channel._id;
                      }).length
                    : 0;

                  return (
                    <button
                      key={channel._id}
                      onClick={() => onRoomChange(channel)}
                      className={`w-full px-2 py-1.5 flex items-center justify-between hover:bg-gray-100 rounded-md transition-colors ${
                        isActive ? "bg-purple-50 text-purple-700" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FaHashtag
                          className={`w-3.5 h-3.5 ${isActive ? "text-purple-600" : "text-gray-400"}`}
                        />
                        <span className={`text-sm ${isActive ? "text-purple-700 font-medium" : "text-gray-600"}`}>
                          {channel.name}
                        </span>
                      </div>

                      {/* show participant count if channel has members */}
                      {channel.participants?.length > 0 && (
                        <div className="bg-gray-200 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-xs font-medium">
                            {channel.participants.length}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* direct messages section with profile photos */}
          <div className="px-3 py-2 mt-4">
            <button
              onClick={() => setMessagesOpen(!messagesOpen)}
              className="w-full px-2 py-1.5 flex items-center justify-between hover:bg-gray-100 rounded-md transition-colors"
            >
              <div className="flex items-center gap-1.5">
                {messagesOpen ? (
                  <IoChevronDown className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <IoChevronForward className="w-3.5 h-3.5 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Direct Messages
                </span>
              </div>
              <span className="text-xs text-gray-400">{uniqueDMs.length}</span>
            </button>

            {messagesOpen && (
              <div className="mt-1 space-y-0.5">
                {!uniqueDMs || uniqueDMs.length === 0 ? (
                  <div className="px-2 py-3 text-center text-gray-400 text-xs">
                    No conversations yet
                  </div>
                ) : (
                  uniqueDMs.map((dm) => {
                    const isActive = currentRoom?._id === dm.roomId;
                    const profilePhoto = getProfilePhotoUrl(dm);
                    
                    return (
                      <button
                        key={dm.userId}
                        onClick={() => handleDmClick(dm)}
                        className={`w-full px-2 py-1.5 flex items-center gap-2 hover:bg-gray-100 rounded-md transition-colors ${
                          isActive ? "bg-purple-50" : ""
                        }`}
                      >
                        {/* user avatar with fallback if image fails */}
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt={dm.userName}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              // if image fails to load, switch to text avatar
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              const fallback = document.createElement('div');
                              fallback.className = 'w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0';
                              fallback.innerHTML = `<span class="text-white font-medium text-xs">${(dm.userName || 'U').charAt(0).toUpperCase()}</span>`;
                              parent.insertBefore(fallback, e.target);
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-xs">
                              {(dm.userName || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* user name */}
                        <div className="flex-1 text-left min-w-0">
                          <div className={`text-sm truncate ${isActive ? "text-purple-700 font-medium" : "text-gray-700"}`}>
                            {dm.userName || 'User'}
                          </div>
                        </div>
                        
                        {/* green dot to show online status */}
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* popup for creating a new channel */}
      {showCreateChannelModal && (
        <CreateChannelModal
          newChannelName={newChannelName}
          setNewChannelName={setNewChannelName}
          channelDescription={channelDescription}
          setChannelDescription={setChannelDescription}
          isChannelPrivate={isChannelPrivate}
          setIsChannelPrivate={setIsChannelPrivate}
          handleCreateChannel={handleCreateChannel}
          setShowCreateChannelModal={setShowCreateChannelModal}
        />
      )}
    </>
  );
};

// modal for creating channels - separate component to keep things organized
const CreateChannelModal = ({
  newChannelName,
  setNewChannelName,
  channelDescription,
  setChannelDescription,
  isChannelPrivate,
  setIsChannelPrivate,
  handleCreateChannel,
  setShowCreateChannelModal
}) => {
  // allow pressing enter to submit the form
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newChannelName.trim()) {
      e.preventDefault();
      handleCreateChannel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">Create a channel</h2>
          <button
            onClick={() => setShowCreateChannelModal(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IoClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          {/* channel name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Channel name
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
              <div className="px-3 bg-gray-50 border-r">
                <FaHashtag className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., project-alpha"
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Use lowercase letters, numbers, and hyphens
            </p>
          </div>
          
          {/* optional description field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>
          
          {/* private/public channel toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Private channel</p>
              <p className="text-xs text-gray-500">
                Only invited members can join
              </p>
            </div>
            <button
              onClick={() => setIsChannelPrivate(!isChannelPrivate)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isChannelPrivate ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isChannelPrivate ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
        
        {/* modal action buttons */}
        <div className="p-5 border-t bg-gray-50 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={handleCreateChannel}
              disabled={!newChannelName.trim()}
              className="flex-1 py-2.5 bg-[#6f46ff] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors"
            >
              Create channel
            </button>
            <button
              onClick={() => setShowCreateChannelModal(false)}
              className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSideBar;