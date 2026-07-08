import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { IoCallOutline, IoVideocamOutline, IoInformationCircleOutline, IoSend, IoAttach, IoDocument } from "react-icons/io5";
import { useSocket } from "../../context/SocketContext";
import CallComponent from "./CallComponent";
import FileUploadModal from "../FileUploadModal";

// store any call signals that arrive before the call component is ready
if (typeof window !== 'undefined') {
    window.globalPendingOffer = null;
    window.globalPendingIceCandidates = [];
}

const MiddleChatarea = ({ 
    messages, 
    onSendMessage, 
    currentRoom, 
    currentUser, 
    activeDm,  
    onExitDM, 
    scrollToMessageId 
}) => {
    const [input, setInput] = useState("");
    const messageRefs = useRef({});
    const { socket, isConnected } = useSocket();
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [callType, setCallType] = useState(null);
    const [isCallInitiator, setIsCallInitiator] = useState(false);
    
    const [isTyping, setIsTyping] = useState(false);
    const [someoneIsTyping, setSomeoneIsTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    
    const [showFileUpload, setShowFileUpload] = useState(false);
    
    const callActiveRef = useRef(false);
    const callIdRef = useRef(null);

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    useEffect(() => {
        console.log("🟢 [MiddleChatarea] activeCall state changed:", activeCall);
    }, [activeCall]);

    useEffect(() => {
        console.log("🟢 [MiddleChatarea] Component mounted");
        return () => console.log("🔴 [MiddleChatarea] Component unmounted");
    }, []);

    // format time for display (just hour:minute)
    const formatTimeOnly = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    // show Today, Yesterday, or full date based on when message was sent
    const getDateSeparator = (dateString) => {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (messageDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (messageDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    // group messages by date so we can show date separators
    const groupMessagesByDate = (messagesList) => {
        const groups = [];
        let currentDateKey = null;
        
        messagesList.forEach((msg) => {
            const msgDate = new Date(msg.createdAt);
            const dateKey = msgDate.toDateString();
            
            if (dateKey !== currentDateKey) {
                groups.push({
                    type: 'separator',
                    date: msgDate,
                    dateKey: dateKey
                });
                currentDateKey = dateKey;
            }
            
            groups.push({
                type: 'message',
                message: msg
            });
        });
        
        return groups;
    };

    // scroll to a specific message when needed (like when replying to a message)
    useLayoutEffect(() => {
        if (!scrollToMessageId) return;
        const el = messageRefs.current[scrollToMessageId];
        if (el) {
            el.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [scrollToMessageId, messages]);

    const handleSubmit = async (e, fileData = null) => {
        e?.preventDefault();
        
        let messageContent = input.trim();
        let fileAttachment = fileData;
        
        if (!messageContent && !fileAttachment) return;
        
        if (fileAttachment) {
            messageContent = `📎 ${fileAttachment.originalName}`;
        }
        
        onSendMessage(messageContent, fileAttachment);
        setInput("");
    };

    // start a voice call
    const handleVoiceCall = () => {
        console.log("🎵🔵 [handleVoiceCall] called");
        
        if (!activeDm) {
            alert("Calls only work in direct messages");
            return;
        }
        
        if (callActiveRef.current) {
            console.log("⚠️ Already in a call, ignoring");
            return;
        }
        
        console.log("📞 Initiating voice call to:", activeDm.userId);
        callActiveRef.current = true;
        
        const newCallId = `${Date.now()}_${activeDm.userId}`;
        callIdRef.current = newCallId;
        
        setActiveCall({
            id: newCallId,
            userId: activeDm.userId,
            userName: activeDm.userName,
            type: "voice"
        });
        setCallType("voice");
        setIsCallInitiator(true);
        
        socket.emit("call-user", {
            to: activeDm.userId,
            type: "voice",
            from: currentUser.id,
            fromName: currentUser.fullname,
            roomId: activeDm.roomId
        });
        console.log("📤 Emitted call-user event");
    };

    // start a video call
    const handleVideoCall = () => {
        console.log("🎥🔵 [handleVideoCall] called");
        
        if (!activeDm) {
            alert("Calls only work in direct messages");
            return;
        }
        
        if (callActiveRef.current) {
            console.log("⚠️ Already in a call, ignoring");
            return;
        }
        
        console.log("📹 Initiating video call to:", activeDm.userId);
        callActiveRef.current = true;
        
        const newCallId = `${Date.now()}_${activeDm.userId}`;
        callIdRef.current = newCallId;
        
        setActiveCall({
            id: newCallId,
            userId: activeDm.userId,
            userName: activeDm.userName,
            type: "video"
        });
        setCallType("video");
        setIsCallInitiator(true);
        
        socket.emit("call-user", {
            to: activeDm.userId,
            type: "video",
            from: currentUser.id,
            fromName: currentUser.fullname,
            roomId: activeDm.roomId
        });
        console.log("📤 Emitted call-user event");
    };

    // accept an incoming call
    const acceptCall = () => {
        console.log("✅🔵 [acceptCall] called");
        
        if (!incomingCall) return;
        if (callActiveRef.current) {
            console.log("⚠️ Already in a call, cannot accept");
            return;
        }
        
        console.log("✅ Accepting call from:", incomingCall.from);
        callActiveRef.current = true;
        
        const newCallId = `${Date.now()}_${incomingCall.from}`;
        callIdRef.current = newCallId;
        
        setActiveCall({
            id: newCallId,
            userId: incomingCall.from,
            userName: incomingCall.fromName,
            type: incomingCall.type
        });
        setCallType(incomingCall.type);
        setIsCallInitiator(false);
        setIncomingCall(null);
        
        // give the CallComponent a moment to mount before telling the other person we accepted
        setTimeout(() => {
            socket.emit("call-accepted", {
                to: incomingCall.from,
                roomId: incomingCall.roomId,
                type: incomingCall.type
            });
            console.log("📤 Emitted call-accepted event");
        }, 300);
    };

    // reject an incoming call
    const rejectCall = () => {
        console.log("❌🔵 [rejectCall] called");
        if (!incomingCall) return;
        
        socket.emit("call-rejected", { to: incomingCall.from });
        setIncomingCall(null);
    };

    // hang up the current call
    const endCall = () => {
        console.log("🔴🔵 [endCall] called");
        
        if (!callActiveRef.current) {
            console.log("🔴 No active call to end");
            return;
        }
        
        if (activeCall) {
            socket.emit("end-call", { 
                to: activeCall.userId, 
                from: currentUser.id 
            });
        }
        
        callActiveRef.current = false;
        callIdRef.current = null;
        setActiveCall(null);
        setCallType(null);
        setIsCallInitiator(false);
        
        // clean up any pending call signals
        if (typeof window !== 'undefined') {
            window.globalPendingOffer = null;
            window.globalPendingIceCandidates = [];
        }
    };

    // catch and store any call signals that arrive before the CallComponent is ready
    useEffect(() => {
        if (!socket) return;
        
        const catchAllSignals = (data) => {
            console.log("🚨 [GLOBAL] call-signal received:", data.signal?.type);
            
            if (data.signal?.type === "offer") {
                console.log("📦 Storing offer globally");
                if (typeof window !== 'undefined') {
                    window.globalPendingOffer = data;
                }
            } else if (data.signal?.type === "ice") {
                console.log("📦 Storing ICE candidate globally");
                if (typeof window !== 'undefined') {
                    if (!window.globalPendingIceCandidates) {
                        window.globalPendingIceCandidates = [];
                    }
                    window.globalPendingIceCandidates.push(data.signal.candidate);
                }
            }
        };
        
        socket.on("call-signal", catchAllSignals);
        
        return () => {
            socket.off("call-signal", catchAllSignals);
        };
    }, [socket]);

    // listen for someone trying to call us
    useEffect(() => {
        if (!socket) return;
        
        const handleIncomingCall = (data) => {
            console.log("🔔 INCOMING CALL RECEIVED");
            
            if (callActiveRef.current) {
                socket.emit("call-rejected", { to: data.from });
                return;
            }
            setIncomingCall(data);
        };
        
        socket.on("incoming-call", handleIncomingCall);

        return () => {
            socket.off("incoming-call", handleIncomingCall);
        };
    }, [socket]);

    // just for logging when a call actually starts
    useEffect(() => {
        if (!socket) return;
        
        const handleCallStarted = (data) => {
            console.log("📞 Call started event received:", data);
        };
        
        socket.on("call-started", handleCallStarted);
        
        return () => {
            socket.off("call-started", handleCallStarted);
        };
    }, [socket]);

    // handle when the other person hangs up
    useEffect(() => {
        if (!socket) return;
        
        const handleCallEnded = () => {
            console.log("🔴 Call ended by other user");
            callActiveRef.current = false;
            setActiveCall(null);
            setCallType(null);
            setIsCallInitiator(false);
            setIncomingCall(null);
            
            if (typeof window !== 'undefined') {
                window.globalPendingOffer = null;
                window.globalPendingIceCandidates = [];
            }
        };
        
        socket.on("call-ended", handleCallEnded);
        
        return () => {
            socket.off("call-ended", handleCallEnded);
        };
    }, [socket]);

    // handle any call errors
    useEffect(() => {
        if (!socket) return;
        
        const handleCallError = (data) => {
            console.error("❌ Call error:", data.message);
            alert(data.message);
            callActiveRef.current = false;
            setActiveCall(null);
            setCallType(null);
            setIsCallInitiator(false);
        };
        
        socket.on("call-error", handleCallError);
        
        return () => {
            socket.off("call-error", handleCallError);
        };
    }, [socket]);

    // show typing indicator when the other person is typing
    useEffect(() => {
        if (!socket) return;
        
        const handleUserTyping = (data) => {
            if (data.userId !== currentUser?.id && data.roomId === (activeDm?.roomId || currentRoom?._id)) {
                setSomeoneIsTyping(data.isTyping);
                if (data.isTyping) {
                    setTimeout(() => {
                        setSomeoneIsTyping(false);
                    }, 3000);
                }
            }
        };
        
        socket.on("userTyping", handleUserTyping);
        
        return () => {
            socket.off("userTyping", handleUserTyping);
        };
    }, [socket, currentUser, activeDm, currentRoom]);

    const getSenderName = (msg) => {
        if (!msg.sender) return 'Anonymous';
        if (currentUser && (msg.sender.id === currentUser.id || msg.sender._id === currentUser.id)) {
            return 'You';
        }
        if (typeof msg.sender === 'object') {
            return msg.sender.fullname || 'User';
        }
        return 'Anonymous';
    };

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className="flex flex-col flex-1 bg-white">
            {/* show incoming call popup */}
            {incomingCall && !activeCall && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white shadow-xl border rounded-xl p-4 z-50 min-w-[300px]">
                    <p className="font-semibold text-gray-900 text-center">
                        {incomingCall.fromName} is calling...
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-3">
                        {incomingCall.type} call
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={acceptCall}
                            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                        >
                            Accept
                        </button>
                        <button
                            onClick={rejectCall}
                            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}

            {/* the actual call interface */}
            {activeCall && (
                <CallComponent
                    key={activeCall.id}
                    callType={callType}
                    isInitiator={isCallInitiator}
                    socket={socket}
                    roomId={activeCall.userId}
                    remoteUserName={activeCall.userName}
                    onEndCall={endCall}
                />
            )}

            {/* chat header with room name and call buttons */}
            <div className="h-14 border-b border-gray-200 px-5 flex items-center justify-between bg-white">
                {activeDm ? (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                            <span className="font-semibold text-md">
                                {activeDm.userName?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm text-gray-900">{activeDm.userName}</h2>
                            <p className="text-xs text-gray-500">Direct message</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-purple-600 text-xl font-bold">#</span>
                        <span className="font-semibold text-md text-gray-900">{currentRoom?.name || "Unknown"}</span>
                        <span className="text-xs text-gray-400 ml-1">
                            {currentRoom?.participants?.length || 0} members
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleVoiceCall}
                        disabled={callActiveRef.current}
                        className={`text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 ${
                            callActiveRef.current ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title={activeDm ? `Call ${activeDm.userName}` : `Call in ${currentRoom?.name}`}
                    >
                        <IoCallOutline className="w-5 h-5" />
                    </button>
                    
                    <button 
                        onClick={handleVideoCall}
                        disabled={callActiveRef.current}
                        className={`text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 ${
                            callActiveRef.current ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title={activeDm ? `Video call ${activeDm.userName}` : `Video call in ${currentRoom?.name}`}
                    >
                        <IoVideocamOutline className="w-5 h-5" />
                    </button>
                    
                    {!activeDm && (
                        <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200">
                            <IoInformationCircleOutline className="w-5 h-5" />
                        </button>
                    )}
                    
                    {activeDm && (
                        <button 
                            onClick={() => {
                                if (window.confirm(`Exit DM with ${activeDm.userName}?`)) {
                                    onExitDM();
                                }
                            }}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                            title="Exit DM"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* the actual chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 message-area">
                <div className="space-y-4 py-2">
                    {!messages || messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                            <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        groupedMessages.map((item, idx) => {
                            if (item.type === 'separator') {
                                const separatorText = getDateSeparator(item.date);
                                return (
                                    <div key={`sep-${item.dateKey}`} className="date-separator">
                                        <span>{separatorText}</span>
                                    </div>
                                );
                            }
                            
                            const msg = item.message;
                            const senderName = getSenderName(msg);
                            const isCurrentUser = currentUser && (
                                msg.sender?.id === currentUser.id || 
                                msg.sender?._id === currentUser.id
                            );
                            
                            const prevMsgIndex = idx - 1;
                            let showSenderName = !isCurrentUser;
                            
                            if (prevMsgIndex >= 0 && groupedMessages[prevMsgIndex]?.type === 'message') {
                                const prevMsg = groupedMessages[prevMsgIndex].message;
                                const prevSenderId = prevMsg.sender?._id || prevMsg.sender?.id;
                                const currentSenderId = msg.sender?._id || msg.sender?.id;
                                const isSameSender = prevSenderId === currentSenderId;
                                const timeDiff = Math.abs(new Date(msg.createdAt) - new Date(prevMsg.createdAt)) / 1000 / 60;
                                
                                if (isSameSender && timeDiff < 5) {
                                    showSenderName = false;
                                }
                            }
                            
                            return (
                                <div
                                    key={msg._id || msg.id || msg.timestamp}
                                    ref={el => {
                                        if (msg._id) messageRefs.current[msg._id] = el;
                                    }}
                                    className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* only show avatar for other people, not for ourselves */}
                                    {!isCurrentUser && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0">
                                            {senderName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    
                                    <div className={`max-w-[70%] ${isCurrentUser ? 'message-own' : 'message-other'}`}>
                                        {!isCurrentUser && showSenderName && (
                                            <div className="text-xs font-semibold text-gray-600 mb-1">
                                                {senderName}
                                            </div>
                                        )}
                                        <div className="break-words">
                                            {msg.content}
                                        </div>
                                        
                                        {/* show file/image if there is one attached */}
                                        {msg.file && (
                                            <div className="mt-2">
                                                {msg.file.mimeType?.startsWith('image/') ? (
                                                    <div className="relative group">
                                                        <img 
                                                            src={msg.file.url} 
                                                            alt={msg.file.originalName}
                                                            className="max-w-full max-h-60 rounded-lg cursor-pointer hover:opacity-90 transition shadow-md"
                                                            onClick={() => window.open(msg.file.url, '_blank')}
                                                        />
                                                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                                                            Click to view full size
                                                        </div>
                                                    </div>
                                                ) : msg.file.mimeType?.startsWith('video/') ? (
                                                    <video 
                                                        src={msg.file.url} 
                                                        controls 
                                                        className="max-w-full max-h-60 rounded-lg shadow-md"
                                                    />
                                                ) : (
                                                    <a 
                                                        href={msg.file.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition group"
                                                    >
                                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                            <IoDocument className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {msg.file.originalName}
                                                            </p>
                                                            <p className="text-xs opacity-70">
                                                                {formatFileSize(msg.file.size)}
                                                            </p>
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className={`text-xs mt-1 text-right ${isCurrentUser ? 'text-purple-600' : 'text-gray-400'}`}>
                                            {formatTimeOnly(msg.createdAt)}
                                            {isCurrentUser && (
                                                <span className="ml-1">
                                                    {msg.status === "sent" && "✓"}
                                                    {msg.status === "delivered" && "✓✓"}
                                                    {msg.status === "seen" && "👁️"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* show typing indicator when someone is typing */}
            {someoneIsTyping && (
                <div className="px-4 py-2">
                    <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span className="text-xs text-gray-500 ml-2">
                            {activeDm ? `${activeDm.userName} is typing...` : 'Someone is typing...'}
                        </span>
                    </div>
                </div>
            )}

            {/* message input area */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-3">
                    {/* attach file button */}
                    <button
                        onClick={() => setShowFileUpload(true)}
                        disabled={callActiveRef.current}
                        className="text-gray-400 hover:text-purple-600 hover:bg-gray-100 p-2 rounded-xl transition-all duration-200"
                        title="Attach file"
                    >
                        <IoAttach className="w-5 h-5" />
                    </button>
                    
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            
                            // let the other person know we're typing
                            if (!isTyping && e.target.value.length > 0) {
                                setIsTyping(true);
                                socket.emit("typing", {
                                    roomId: activeDm?.roomId || currentRoom?._id,
                                    userId: currentUser.id,
                                    username: currentUser.fullname,
                                    isTyping: true
                                });
                            }
                            
                            // stop showing typing indicator after 2 seconds of no input
                            if (typingTimeout) clearTimeout(typingTimeout);
                            const timeout = setTimeout(() => {
                                if (isTyping) {
                                    setIsTyping(false);
                                    socket.emit("typing", {
                                        roomId: activeDm?.roomId || currentRoom?._id,
                                        userId: currentUser.id,
                                        username: currentUser.fullname,
                                        isTyping: false
                                    });
                                }
                            }, 2000);
                            setTypingTimeout(timeout);
                        }}
                        placeholder={activeDm
                            ? `Message ${activeDm.userName}...`
                            : `Message #${currentRoom?.name}`}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                handleSubmit(e);
                                // stop typing indicator when sending
                                if (isTyping) {
                                    setIsTyping(false);
                                    socket.emit("typing", {
                                        roomId: activeDm?.roomId || currentRoom?._id,
                                        userId: currentUser.id,
                                        username: currentUser.fullname,
                                        isTyping: false
                                    });
                                }
                            }
                        }}
                    />
                    <button 
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                        className="bg-purple-600 text-white p-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <IoSend className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* modal for uploading files */}
            {showFileUpload && (
                <FileUploadModal
                    onFileUpload={(file) => {
                        handleSubmit(null, file);
                        setShowFileUpload(false);
                    }}
                    onClose={() => setShowFileUpload(false)}
                />
            )}
        </div>
    );
};

export default MiddleChatarea;