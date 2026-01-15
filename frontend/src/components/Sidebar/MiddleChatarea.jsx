import { useState } from "react";
import { IoCallOutline, IoVideocamOutline, IoInformationCircleOutline, IoSend } from "react-icons/io5";

const MiddleChatarea = ({ messages, onSendMessage, currentRoom, currentUser, activeDm, onExitDM }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  // Format time safely 
  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Just now';
    }
  };

  // Get sender display name 
  const getSenderName = (msg) => {
    if (!msg.sender) return 'Anonymous';

    // Check if it's the current user
    if (currentUser && msg.sender.id === currentUser.id) {
      return 'You';
    }

    // Check 
    if (typeof msg.sender === 'object') {
      return msg.sender.fullname || 'User';
    }
    return 'Anonymous';
  };

  // Get safe profile photo URL
  const getProfilePhoto = (msg) => {
    if (!msg.sender?.profilePhoto) return null;
    
    // Check for empty string
    if (msg.sender.profilePhoto.trim() === '') {
      return null;
    }
    
    return msg.sender.profilePhoto;
  };

  // Handle voice call
  const handleVoiceCall = () => {
    if (activeDm) {
      console.log(`Starting voice call with ${activeDm.userName}`);
      alert(`Starting voice call with ${activeDm.userName}`);
    } else {
      console.log(`Starting voice call in channel ${currentRoom}`);
      alert(`Starting voice call in channel ${currentRoom}`);
    }
  };

  // Handle video call
  const handleVideoCall = () => {
    if (activeDm) {
      console.log(`Starting video call with ${activeDm.userName}`);
      alert(`Starting video call with ${activeDm.userName}`);
    } else {
      console.log(`Starting video call in channel ${currentRoom}`);
      alert(`Starting video call in channel ${currentRoom}`);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/** Header */}
      <div className="h-16 border-b border-gray-200 p-6 flex items-center justify-between">
        {/** Left side */}
        {activeDm ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <span className="font-bold text-lg">
                {activeDm.userName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">💬 {activeDm.userName}</h2>
              <p className="text-sm text-gray-500">Direct message • {activeDm.userEmail}</p>
            </div>
          </div>
        ) : (
          // channel head
          <div className="flex items-center gap-2">
            <span className="text-purple-600 text-2xl font-bold">#</span>
            <span className="text-xl font-bold text-gray-900">{currentRoom}</span>
            <span className="text-gray-500 text-sm ml-2">124 members</span>
          </div>
        )}

        {/** Right side - Clean single set of buttons */}
        <div className="flex items-center gap-4">
          {/* Call icon - ALWAYS SHOWN */}
          <button 
            onClick={handleVoiceCall}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            title={activeDm ? `Call ${activeDm.userName}` : `Call in ${currentRoom}`}
          >
            <IoCallOutline className="w-6 h-6" />
          </button>
          
          {/* Video icon - ALWAYS SHOWN */}
          <button 
            onClick={handleVideoCall}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            title={activeDm ? `Video call ${activeDm.userName}` : `Video call in ${currentRoom}`}
          >
            <IoVideocamOutline className="w-6 h-6" />
          </button>
          
          {/* Info icon - SHOW ONLY IN CHANNEL MODE */}
          {!activeDm && (
            <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <IoInformationCircleOutline className="w-6 h-6" />
            </button>
          )}
          
          {/* Cancel button - SHOW ONLY IN DM MODE */}
          {activeDm && (
            <button 
              onClick={() => {
                if (window.confirm(`Exit DM with ${activeDm.userName}?`)) {
                  onExitDM();
                }
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
              title="Exit DM"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/** Message Area */}
      <div className="flex-1 overflow-y-auto px-6 p-4 bg-white">
        <div className="space-y-6 py-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const senderName = getSenderName(msg);
              const profilePhoto = getProfilePhoto(msg);
              const isCurrentUser = currentUser && msg.sender?.id === currentUser.id;

              return (
                <div
                  key={msg._id || msg.id || msg.timestamp}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt={senderName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                  {/* Show placeholder when no photo */}
                  <div className={`w-10 h-10 rounded-full ${isCurrentUser ? 'bg-purple-600' : 'bg-gray-400'} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold">
                      {senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                      <span className="font-bold text-gray-900">
                        {senderName}  
                      </span>
                      <span className="text-gray-500 text-sm">
                        {formatTime(msg.createdAt)} 
                      </span>
                    </div>
                    <p className={`text-gray-800 text-sm leading-relaxed ${isCurrentUser ? 'text-right' : ''}`}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/** Input Box */}
      <div className="border-t border-gray-200 p-4 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeDm ? `Message ${activeDm.userName}...` : `Message #${currentRoom}`}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e);
            }
          }}
        />
        <button 
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <IoSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MiddleChatarea;