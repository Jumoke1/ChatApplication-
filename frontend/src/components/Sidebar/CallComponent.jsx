import { useEffect, useRef, useState } from "react";
import { IoCall, IoMic, IoMicOff, IoVideocam, IoVideocamOff, IoClose } from "react-icons/io5";

const CallComponent = ({ 
    callType,
    isInitiator,
    socket,
    roomId,
    remoteUserName,
    onEndCall 
}) => {
    const [localStream, setLocalStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("Connecting...");
    const [callDuration, setCallDuration] = useState(0);
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const hasProcessedRef = useRef(false);
    const timerRef = useRef(null);
    
    // turns seconds into MM:SS or HH:MM:SS format
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // start counting call duration once connected
    useEffect(() => {
        if (connectionStatus === "Connected" && !timerRef.current) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [connectionStatus]);
    
    // handle any signals that arrived before this component was ready
    useEffect(() => {
        if (isInitiator || hasProcessedRef.current) return;
        
        const processGlobalSignals = () => {
            const pc = peerConnectionRef.current;
            if (!pc) return;
            
            if (window.globalPendingOffer && !hasProcessedRef.current) {
                hasProcessedRef.current = true;
                const offer = window.globalPendingOffer;
                window.globalPendingOffer = null;
                
                pc.setRemoteDescription(new RTCSessionDescription(offer.signal.sdp))
                    .then(() => pc.createAnswer())
                    .then(answer => pc.setLocalDescription(answer))
                    .then(() => {
                        socket.emit("call-signal", {
                            to: roomId,
                            signal: { type: "answer", sdp: pc.localDescription }
                        });
                        
                        if (window.globalPendingIceCandidates) {
                            window.globalPendingIceCandidates.forEach(candidate => {
                                pc.addIceCandidate(new RTCIceCandidate(candidate));
                            });
                            window.globalPendingIceCandidates = [];
                        }
                    })
                    .catch(err => console.error(err));
            }
        };
        
        const interval = setInterval(processGlobalSignals, 100);
        return () => clearInterval(interval);
    }, [isInitiator, socket, roomId]);
    
    // get access to mic and camera
    useEffect(() => {
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: callType === "video"
        };
        
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                setLocalStream(stream);
                localStreamRef.current = stream;
                if (localVideoRef.current && callType === "video") {
                    localVideoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error(err);
                setConnectionStatus("Media failed");
            });
            
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [callType]);
    
    // set up the peer connection
    useEffect(() => {
        if (!localStream || !socket) return;
        
        const configuration = {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" }
            ]
        };
        
        const pc = new RTCPeerConnection(configuration);
        peerConnectionRef.current = pc;
        
        // send our audio/video to the other person
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
        
        // handle incoming audio/video from the other person - FIXED
        pc.ontrack = (event) => {
            // always attach to audio element for voice
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
                remoteAudioRef.current.play().catch(e => console.error(e));
            }
            // also attach to video element if video call
            if (callType === "video" && remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
            setConnectionStatus("Connected");
        };
        
        // exchange connection candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("call-signal", {
                    to: roomId,
                    signal: { type: "ice", candidate: event.candidate }
                });
            }
        };
        
        // track connection state
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
                setConnectionStatus("Connected");
            } else if (pc.connectionState === "failed") {
                setConnectionStatus("Connection failed");
            }
        };
        
        // if we're the caller, create and send the offer
        if (isInitiator) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    socket.emit("call-signal", {
                        to: roomId,
                        signal: { type: "offer", sdp: pc.localDescription }
                    });
                })
                .catch(err => console.error(err));
        }
        
        return () => pc.close();
    }, [localStream, socket, roomId, isInitiator, callType]);
    
    // listen for signaling messages (offers, answers, ice candidates)
    useEffect(() => {
        if (!socket) return;
        
        const handleSignal = (data) => {
            const pc = peerConnectionRef.current;
            if (!pc) return;
            
            if (data.signal.type === "offer" && !isInitiator) {
                pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp))
                    .then(() => pc.createAnswer())
                    .then(answer => pc.setLocalDescription(answer))
                    .then(() => {
                        socket.emit("call-signal", {
                            to: roomId,
                            signal: { type: "answer", sdp: pc.localDescription }
                        });
                    })
                    .catch(err => console.error(err));
            }
            else if (data.signal.type === "answer" && isInitiator) {
                pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp))
                    .catch(err => console.error(err));
            }
            else if (data.signal.type === "ice") {
                pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate))
                    .catch(err => console.error(err));
            }
        };
        
        socket.on("call-signal", handleSignal);
        return () => socket.off("call-signal", handleSignal);
    }, [socket, roomId, isInitiator]);
    
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };
    
    const toggleVideo = () => {
        if (localStreamRef.current && callType === "video") {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };
    
    const endCall = () => {
        // stop the timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        // clean up media streams
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        socket.emit("end-call", { to: roomId });
        onEndCall();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
            {/* header area with call info and timer */}
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">
                        {callType === "video" ? "Video Call" : "Voice Call"}
                    </h2>
                    <p className="text-sm text-gray-400">
                        {connectionStatus} with {remoteUserName}
                    </p>
                </div>
                {/* show timer once connected */}
                <div className="text-center">
                    {connectionStatus === "Connected" && (
                        <div className="text-green-400 font-mono text-lg">
                            {formatDuration(callDuration)}
                        </div>
                    )}
                </div>
                <button onClick={endCall} className="p-2 hover:bg-red-600 rounded-full">
                    <IoClose className="w-6 h-6" />
                </button>
            </div>
            
            {/* main video/audio area */}
            <div className="flex-1 relative">
                {callType === "video" ? (
                    <>
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-4 right-4 w-48 h-64 rounded-lg border-2 border-white object-cover shadow-lg" />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        {/* audio element for voice calls - crucial for hearing audio */}
                        <audio ref={remoteAudioRef} autoPlay playsInline />
                        <div className="text-center">
                            <div className={`w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center ${
                                connectionStatus === "Connected" ? "bg-green-600" : "bg-purple-600 animate-pulse"
                            }`}>
                                <IoCall className="w-16 h-16 text-white" />
                            </div>
                            <p className="text-white text-xl">{remoteUserName}</p>
                            <p className="text-gray-400 mt-2">{connectionStatus}</p>
                            {connectionStatus === "Connected" && (
                                <p className="text-green-400 text-lg mt-4 font-mono">
                                    {formatDuration(callDuration)}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* call controls */}
            <div className="bg-gray-900 p-4 flex justify-center gap-6">
                <button onClick={toggleMute} className={`p-4 rounded-full ${isMuted ? "bg-red-600" : "bg-gray-700"}`}>
                    {isMuted ? <IoMicOff className="w-6 h-6 text-white" /> : <IoMic className="w-6 h-6 text-white" />}
                </button>
                <button onClick={endCall} className="p-4 rounded-full bg-red-600">
                    <IoCall className="w-6 h-6 text-white rotate-135" />
                </button>
                {callType === "video" && (
                    <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoOff ? "bg-red-600" : "bg-gray-700"}`}>
                        {isVideoOff ? <IoVideocamOff className="w-6 h-6 text-white" /> : <IoVideocam className="w-6 h-6 text-white" />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CallComponent;