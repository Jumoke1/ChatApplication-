import { IoSearch, IoNotifications, IoChevronDown, IoChatbubbleEllipses, IoClose } from "react-icons/io5";
import { useState, useEffect, useRef } from "react";
import { dmAPI, channelAPI } from "../api"; 

const TopNavbar = ({user, users, messages, recentDMs, onSelectUser,
  onSelectDM, onSelectChannel}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [unreadDMs, setUnreadDMs] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null); // used to detect clicks outside the notification panel

  const safeQuery = query.trim().toLowerCase();

  // grab unread message counts from both dms and channels
  const fetchUnreadData = async () => {
    try {
      const dmDetailsRes = await dmAPI.getUnreadDetails();
      const dmDetails = dmDetailsRes.data?.data || [];
    
      const channelDetailsRes = await channelAPI.getUnreadDetails();
      const channelDetails = channelDetailsRes.data?.data || [];

      const dmCountRes = await dmAPI.getUnreadCount();
      const channelCountRes = await channelAPI.getUnreadCount();

      const dmTotal = dmCountRes.data?.data?.total || 0;
      const channelTotal = channelCountRes.data?.data?.total || 0;

      setUnreadDMs(dmDetails);
      setUnreadChannels(channelDetails);
      setUnreadCount(dmTotal + channelTotal);
    } catch (error) {
      console.error('Error fetching unread data:', error);
    }
  };

  // load unread counts on mount and refresh every 30 seconds
  useEffect(() => {
    fetchUnreadData();
    
    const interval = setInterval(fetchUnreadData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // close notification panel when user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleMarkDMAsRead = async (dmRoomId) => {
    await dmAPI.markAsRead(dmRoomId);
    setUnreadDMs(prev => prev.filter(dm => dm.roomId !== dmRoomId));
    setUnreadCount(prev => prev - 1);
  };
  
  const handleMarkChannelAsRead = async (channelId) => {
    await channelAPI.markAsRead(channelId);
    setUnreadChannels(prev => prev.filter(ch => ch.roomId !== channelId));
    setUnreadCount(prev => prev - 1);
  };
  
  const handleMarkAllAsRead = async () => {
    await Promise.all([
      dmAPI.markAllAsRead(),
      channelAPI.markAllAsRead()
    ]);
    setUnreadDMs([]);
    setUnreadChannels([]);
    setUnreadCount(0);
  };
  
  // user clicked on a dm notification - mark as read and open the conversation
  const handleDMNotificationClick = async (dm) => {
    await handleMarkDMAsRead(dm.roomId);
    onSelectDM(dm);
    setShowNotifications(false);
  };
  
  // user clicked on a channel notification - mark as read and open the channel
  const handleChannelNotificationClick = async (channel) => {
    await handleMarkChannelAsRead(channel.roomId);
    onSelectChannel({ id: channel.roomId, name: channel.name });
    setShowNotifications(false);
  };

  // filter users, messages, and dms based on search query
  const filteredUsers = safeQuery
    ? users.filter(u => u.fullname.toLowerCase().includes(safeQuery))
    : users;

  const filteredMessages = safeQuery
    ? messages.filter(msg => msg.content?.toLowerCase().includes(safeQuery))
    : messages;
    
  const filteredDMs = safeQuery
    ? recentDMs.filter(dm => dm.userName?.toLowerCase().includes(safeQuery))
    : recentDMs;

  // detect if we're on a mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // close mobile search when switching back to desktop view
  useEffect(() => {
    if (!isMobile) {
      setShowMobileSearch(false);
    }
  }, [isMobile]);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    const first = parts[0]?.charAt(0) || "";
    const last = parts[1]?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  return (
    <nav className="w-full h-16 bg-gradient-to-r from-[#6252fe] via-[#526bff] to-[#11bdff] px-4 md:px-6 flex items-center justify-between shadow-md relative">
      
      {/* logo section on the left */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#4c1d95] rounded-lg flex items-center justify-center">
          <IoChatbubbleEllipses className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <span className="text-white text-lg md:text-xl font-bold hidden sm:block">
          FlowChat
        </span>
      </div>

      {/* desktop search bar */}
      <div className="hidden md:block flex-1 max-w-xl mx-4 lg:mx-8">
        <div className="relative w-full">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conversations, people, files..."
            className="w-full h-10 pl-10 pr-4 bg-white/10 rounded-lg text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all backdrop-blur-sm"
          />
          {/* search results dropdown */}
          {safeQuery && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
              {filteredUsers.map(u => (
                <div
                  key={u.id || u._id}
                  onClick={() => {
                    onSelectUser(u);
                    setQuery("");
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                    {u.fullname?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 truncate">
                    {u.fullname}
                  </span>
                </div>
              ))}
              
              {filteredDMs.map(dm => (
                <div
                  key={dm.roomId}
                  onClick={() => {
                    onSelectDM(dm);
                    setQuery("");
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {dm.userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Direct message
                  </p>
                </div>
              ))}

              {filteredMessages.map(msg => (
                <div
                  key={msg._id}
                  onClick={() => {
                    if (msg.isDM && msg.dmRoomId) {
                      const dmInfo = recentDMs.find(dm => dm.roomId === msg.dmRoomId);
                      if (dmInfo) {
                        onSelectDM(dmInfo, msg._id);
                      } else {
                        onSelectDM({
                          roomId: msg.dmRoomId,
                          userId: msg.sender?._id || msg.sender?.id,
                          userName: msg.sender?.fullname || "DM",
                        }, msg._id);
                      }
                    }
                    setQuery("");
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <p className="text-gray-700 truncate">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
          {safeQuery &&
            filteredUsers.length === 0 &&
            filteredDMs.length === 0 &&
            filteredMessages.length === 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg p-4 text-center">
                <p className="text-gray-500 text-sm">No results found</p>
              </div>
            )}
        </div>
      </div>

      {/* full screen search overlay for mobile */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-0 z-50 bg-gradient-to-r from-[#6252fe] via-[#526bff] to-[#11bdff] p-4 flex items-center">
          <div className="relative w-full">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search conversations, people, files..."
              className="w-full h-12 pl-10 pr-16 bg-white/20 rounded-lg text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all backdrop-blur-sm text-lg"
              autoFocus
            />
            <button 
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white font-medium px-3 py-1 rounded hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* right side - notifications and user profile */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        {/* mobile search toggle button */}
        <button 
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setShowMobileSearch(true)}
        >
          <IoSearch className="w-5 h-5" />
        </button>

        {/* notification bell with dropdown panel */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Notifications"
          >
            <IoNotifications className="w-5 h-5 md:w-6 md:h-6" />
            
            {/* badge showing total unread count */}
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 rounded-full flex items-center justify-center px-1 shadow-lg">
                <span className="text-white text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </div>
            )}
          </button>

          {/* notification dropdown panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({unreadCount} unread)
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {/* list of unread direct messages */}
                {unreadDMs.map(dm => (
                  <div 
                    key={dm.roomId}
                    onClick={() => handleDMNotificationClick(dm)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold text-sm">
                          {getInitials(dm.userName)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {dm.userName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {dm.lastMessage}
                        </p>
                        <span className="text-xs text-purple-600 mt-1 inline-block">
                          {dm.count} new message{dm.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    </div>
                  </div>
                ))}

                {/* list of unread channels */}
                {unreadChannels.map(channel => (
                  <div 
                    key={channel.roomId}
                    onClick={() => handleChannelNotificationClick(channel)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">
                          #
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {channel.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {channel.lastMessage}
                        </p>
                        <span className="text-xs text-blue-600 mt-1 inline-block">
                          {channel.count} new message{channel.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    </div>
                  </div>
                ))}

                {/* show this when there are no unread messages */}
                {unreadCount === 0 && (
                  <div className="p-8 text-center">
                    <IoNotifications className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No new notifications</p>
                    <p className="text-gray-400 text-xs mt-1">
                      You're all caught up!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* user avatar / profile button */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center font-bold text-purple-600">
            {getInitials(user?.fullname)}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;