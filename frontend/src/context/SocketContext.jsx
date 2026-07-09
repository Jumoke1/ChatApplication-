
import { createContext, useState, useContext, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

    // Use environment variable for socket server URL
  const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // pull user id out of the jwt token
  const getUserIdFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const connectSocket = (token) => {
    // close existing connection if there is one
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const userId = getUserIdFromToken(token);
    console.log('🔌 Connecting socket with userId:', userId);

    const newSocket = io(SOCKET_URL, {
      auth: { userId },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      pingTimeout: 60000,
      pingInterval: 25000
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Connected to backend socket, ID:", newSocket.id);
      
      if (userId) {
        console.log("📝 Registering user for calls:", userId);
        newSocket.emit('register-user', userId);
        
        // join a personal room using colon format (matches what the server expects)
        newSocket.emit('joinRoom', `user:${userId}`);
        console.log(`🏠 Joined personal room: user:${userId}`);
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from backend socket, reason:", reason);
      setIsConnected(false);
      
      // try to reconnect if the connection dropped unexpectedly
      if (reason === "transport close" || reason === "transport error") {
        console.log("🔄 Attempting to reconnect...");
        setTimeout(() => {
          if (!newSocket.connected) {
            newSocket.connect();
          }
        }, 1000);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      if (userId) {
        newSocket.emit('register-user', userId);
        // rejoin the personal room after reconnecting
        newSocket.emit('joinRoom', `user:${userId}`);
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      console.log("🔌 Socket manually disconnected");
    }
  };

  // clean up socket when the app unmounts
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      connectSocket, 
      disconnectSocket 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};