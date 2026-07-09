import { io } from "socket.io-client";

// Use environment variable,
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'] 
});